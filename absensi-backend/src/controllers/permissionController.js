const Permission = require('../models/Permission');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { sendNotification } = require('../utils/notificationService');
const supabase = require('../utils/supabase');
const path = require('path');

// @desc    Submit Pengajuan Izin/Sakit (Siswa)
// @route   POST /api/permissions
exports.submitPermission = async (req, res, next) => {
  try {
    const { startDate, endDate, type, reason } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Harap sertakan file bukti (Surat Dokter/Orang Tua)' });
    }

    // 1. Ambil data siswa untuk penamaan file
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });

    // 2. Siapkan penamaan file & folder
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `izin_${student.nisn}_${timestamp}_${randomStr}${ext}`;
    const currentYear = new Date().getFullYear();
    const filePath = `${currentYear}/${fileName}`;

    // 3. Upload ke Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('permission-attachments')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      return res.status(500).json({ 
        success: false, 
        message: `Gagal upload file ke Supabase Storage: ${uploadError.message || 'Unknown Error'}`,
        error: uploadError
      });
    }

    // 4. Dapatkan Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('permission-attachments')
      .getPublicUrl(filePath);

    // 5. Simpan ke MongoDB
    const permission = await Permission.create({
      student: req.user.id,
      startDate,
      endDate,
      type,
      reason,
      attachmentUrl: publicUrl
    });

    // Cari Wali Kelas dari siswa ini
    if (student && student.classId) {
      const waliKelas = await User.findOne({ role: 'wali_kelas', classId: student.classId });
      if (waliKelas) {
        sendNotification({
          recipient: waliKelas._id,
          title: 'Pengajuan Izin Baru',
          message: `${student.name} mengajukan ${type} dari tanggal ${startDate} s/d ${endDate}.`,
          type: 'info',
          link: '/dashboard'
        });
      }
    }

    res.status(201).json({ success: true, message: 'Pengajuan izin berhasil dikirim', data: permission });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Riwayat Izin Diri Sendiri (Siswa)
// @route   GET /api/permissions/me
exports.getMyPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find({ student: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Daftar Izin Kelas (Wali Kelas)
// @route   GET /api/permissions/class
exports.getClassPermissions = async (req, res, next) => {
  try {
    // Karena Wali Kelas punya classId, kita filter user berdasarkan classId Wali Kelas
    const User = require('../models/User');
    const wali = await User.findById(req.user.id);
    
    if (!wali.classId) {
      return res.status(400).json({ success: false, message: 'Anda belum ditugaskan ke kelas manapun' });
    }

    // Ambil semua siswa di kelas tersebut
    const students = await User.find({ classId: wali.classId, role: 'siswa' }).select('_id');
    const studentIds = students.map(s => s._id);

    // Cari permission milik siswa-siswa tersebut
    const permissions = await Permission.find({ student: { $in: studentIds } })
      .populate('student', 'name nisn')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: permissions.length, data: permissions });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve / Reject Izin (Wali Kelas)
// @route   PUT /api/permissions/:id/status
exports.updatePermissionStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' atau 'rejected'
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({ success: false, message: 'Data pengajuan tidak ditemukan' });
    }

    permission.status = status;
    permission.reviewedBy = req.user.id;
    permission.reviewedAt = new Date();
    await permission.save();

    // Jika APPROVED, inject data ke Attendance
    if (status === 'approved') {
      const start = new Date(permission.startDate);
      const end = new Date(permission.endDate);
      
      // Looping dari startDate sampai endDate
      for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dateString = d.toISOString().split('T')[0];
        
        // Cari absensi di tanggal tersebut
        let attendance = await Attendance.findOne({ student: permission.student, date: dateString });
        
        if (attendance) {
          // Jangan overwrite jika hadir/telat
          if (attendance.status === 'alfa') {
            attendance.status = permission.type; // 'izin' atau 'sakit'
            await attendance.save();
          }
        } else {
          // Jika belum ada record sama sekali (kosong), buat record baru
          await Attendance.create({
            student: permission.student,
            date: dateString,
            checkIn: new Date(),
            status: permission.type,
            location: { lat: 0, lng: 0 },
            distance: 0
          });
        }
      }
    }

    // Kirim notifikasi ke Siswa
    const statusText = status === 'approved' ? 'Disetujui' : 'Ditolak';
    sendNotification({
      recipient: permission.student,
      title: `Izin ${statusText}`,
      message: `Pengajuan ${permission.type} Anda telah ${statusText.toLowerCase()} oleh Wali Kelas.`,
      type: status === 'approved' ? 'success' : 'error',
      link: '/dashboard'
    });

    // Notifikasi ke Orang Tua
    const studentObj = await User.findById(permission.student);
    if (studentObj && studentObj.parentId) {
      sendNotification({
        recipient: studentObj.parentId,
        title: `Izin Anak ${statusText}`,
        message: `Pengajuan ${permission.type} anak Anda telah ${statusText.toLowerCase()}.`,
        type: status === 'approved' ? 'success' : 'error',
        link: '/dashboard'
      });
    }

    res.status(200).json({ success: true, message: `Pengajuan berhasil di-${status}`, data: permission });
  } catch (error) {
    next(error);
  }
};
