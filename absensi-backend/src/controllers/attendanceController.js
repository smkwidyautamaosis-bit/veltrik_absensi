const Attendance = require('../models/Attendance');
const Config = require('../models/Config');
const Holiday = require('../models/Holiday');
const { calculateDistance } = require('../utils/haversine');

// Default config if not found
const DEFAULT_LAT = -6.2088;
const DEFAULT_LNG = 106.8456;
const DEFAULT_RADIUS = 50;

// @desc    Proses Check-In Siswa
// @route   POST /api/attendance/checkin
exports.checkIn = async (req, res, next) => {
  try {
    const { qrToken, lat, lng } = req.body;
    const studentId = req.user.id; 

    // 0. Validasi Hari Libur (Akhir Pekan & Libur Sekolah)
    // Sesuaikan timezone WIB (UTC+7)
    const nowWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const dayOfWeek = nowWIB.getUTCDay();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(403).json({ success: false, message: 'Absensi ditutup. Hari ini adalah akhir pekan.' });
    }

    const todayString = nowWIB.toISOString().split('T')[0];
    const holidayDate = new Date(todayString);
    holidayDate.setHours(0, 0, 0, 0);

    const isHoliday = await Holiday.findOne({ date: holidayDate });
    if (isHoliday) {
      return res.status(403).json({ success: false, message: `Absensi ditutup. Hari ini libur: ${isHoliday.description}` });
    }

    // 1. Validasi QR Token Statis
    const validToken = process.env.STATIC_QR_TOKEN || 'VELTRIK_ABSENSI_WIDYA_UTAMA_2026';
    if (qrToken !== validToken) {
      return res.status(400).json({ success: false, message: 'QR Code tidak valid atau bukan milik sekolah ini' });
    }

    // 2. Ambil Config dari Database
    const configs = await Config.find({ key: { $in: ['school_lat', 'school_lng', 'max_radius'] } });
    let configData = {};
    configs.forEach(c => { configData[c.key] = c.value; });

    // 3. Validasi Jarak GPS (Haversine)
    const schoolLat = configData.school_lat !== undefined ? parseFloat(configData.school_lat) : parseFloat(process.env.SCHOOL_LAT) || DEFAULT_LAT;
    const schoolLng = configData.school_lng !== undefined ? parseFloat(configData.school_lng) : parseFloat(process.env.SCHOOL_LNG) || DEFAULT_LNG;
    const maxRadius = configData.max_radius !== undefined ? parseFloat(configData.max_radius) : parseFloat(process.env.MAX_RADIUS_METERS) || DEFAULT_RADIUS;

    const distance = calculateDistance(lat, lng, schoolLat, schoolLng);
    if (distance > maxRadius) {
      return res.status(403).json({
        success: false,
        message: `Anda berada di luar radius sekolah. Jarak: ${Math.round(distance)}m (Maksimal: ${maxRadius}m)`,
      });
    }

    // 3. Validasi Double Attendance
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = await Attendance.findOne({ student: studentId, date: today });
    
    if (existingAttendance) {
      return res.status(400).json({ success: false, message: 'Anda sudah melakukan absensi hari ini' });
    }

    // 4. Tentukan Status (Hadir / Terlambat)
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5);
    const lateTime = process.env.ATTENDANCE_LATE_TIME || '07:15';
    
    const status = currentTime > lateTime ? 'telat' : 'hadir';

    // 5. Simpan Absensi
    const attendance = await Attendance.create({
      student: studentId,
      date: today,
      checkIn: now,
      status,
      location: { lat, lng },
      distance: Math.round(distance),
    });

    const populatedAttendance = await Attendance.findById(attendance._id).populate('student', 'name nisn classId');

    // Emit event realtime ke dashboard
    const io = req.app.get('io');
    io.emit('new-attendance', populatedAttendance);

    res.status(201).json({
      success: true,
      message: `Absensi berhasil. Status: ${status}`,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Riwayat Absensi Siswa
// @route   GET /api/attendance/history
exports.getHistory = async (req, res, next) => {
  try {
    const history = await Attendance.find({ student: req.user.id }).sort({ checkIn: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Absensi Hari Ini
// @route   GET /api/attendance/today
exports.getTodayAttendance = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendances = await Attendance.find({ date: today })
      .populate('student', 'name nisn classId')
      .sort({ checkIn: -1 });
      
    res.status(200).json({ success: true, count: attendances.length, data: attendances });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Data Laporan Absensi (Filter)
// @route   GET /api/attendance/report
exports.getReport = async (req, res, next) => {
  try {
    const { startDate, endDate, classId, studentId } = req.query;

    let filter = {};

    // Filter Tanggal
    if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.date = { $gte: startDate };
    } else if (endDate) {
      filter.date = { $lte: endDate };
    }

    // Filter Siswa
    if (studentId) {
      filter.student = studentId;
    }

    // Kita butuh populate data siswa dan kelasnya
    let query = Attendance.find(filter)
      .populate({
        path: 'student',
        select: 'name nisn classId',
        populate: {
          path: 'classId',
          select: 'name major'
        }
      })
      .sort({ date: 1, checkIn: 1 });

    let attendances = await query;

    // Filter Kelas (Karena kelas ada di referensi populate, kita filter manual di memory setelah query)
    // Walaupun kurang optimal untuk jutaan data, ini paling simple untuk skala sekolah.
    if (classId) {
      attendances = attendances.filter(record => 
        record.student && record.student.classId && record.student.classId._id.toString() === classId
      );
    }

    res.status(200).json({ success: true, count: attendances.length, data: attendances });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Status Absensi Manual (Wali Kelas / Admin)
// @route   PUT /api/attendance/:id/status
exports.updateAttendanceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['hadir', 'telat', 'izin', 'sakit', 'alfa'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'Data absensi tidak ditemukan' });
    }

    attendance.status = status;
    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id).populate('student', 'name nisn classId');

    // Beritahu frontend via socket bahwa ada update
    const io = req.app.get('io');
    io.emit('update-attendance', populatedAttendance);

    res.status(200).json({ success: true, message: 'Status berhasil diperbarui', data: populatedAttendance });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate Alpa untuk Siswa yang belum absen hari ini
// @route   POST /api/attendance/generate-alpa
exports.generateAlpa = async (req, res, next) => {
  try {
    const User = require('../models/User'); // Import User locally untuk hindari circular dependency
    const today = new Date().toISOString().split('T')[0];

    // Ambil semua ID siswa aktif
    const students = await User.find({ role: 'siswa' }).select('_id');
    const studentIds = students.map(s => s._id.toString());

    // Ambil semua absensi hari ini
    const todayAttendances = await Attendance.find({ date: today }).select('student');
    const presentStudentIds = todayAttendances.map(a => a.student.toString());

    // Cari siswa yang tidak ada di daftar absensi hari ini
    const absentStudentIds = studentIds.filter(id => !presentStudentIds.includes(id));

    if (absentStudentIds.length === 0) {
      return res.status(200).json({ success: true, message: 'Semua siswa sudah memiliki data absensi hari ini.' });
    }

    // Buat data alpa massal
    const alpaRecords = absentStudentIds.map(id => ({
      student: id,
      date: today,
      checkIn: new Date(),
      status: 'alfa',
      location: { lat: 0, lng: 0 },
      distance: 0
    }));

    await Attendance.insertMany(alpaRecords);

    res.status(201).json({ 
      success: true, 
      message: `${absentStudentIds.length} siswa berhasil ditandai Alpa.`,
      count: absentStudentIds.length 
    });
  } catch (error) {
    if (next) next(error);
    else console.error('Auto-Alpa Error:', error);
  }
};