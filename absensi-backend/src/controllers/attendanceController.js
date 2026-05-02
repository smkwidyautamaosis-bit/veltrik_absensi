const Attendance = require('../models/Attendance');
const { calculateDistance } = require('../utils/haversine');

// @desc    Proses Check-In Siswa
// @route   POST /api/attendance/checkin
exports.checkIn = async (req, res, next) => {
  try {
    const { qrToken, lat, lng } = req.body;
    const studentId = req.user.id; 

    // 1. Validasi QR Token Statis
    const validToken = process.env.STATIC_QR_TOKEN || 'VELTRIK_ABSENSI_WIDYA_UTAMA_2026';
    if (qrToken !== validToken) {
      return res.status(400).json({ success: false, message: 'QR Code tidak valid atau bukan milik sekolah ini' });
    }

    // 2. Validasi Jarak GPS (Haversine)
    const schoolLat = parseFloat(process.env.SCHOOL_LAT);
    const schoolLng = parseFloat(process.env.SCHOOL_LNG);
    const maxRadius = parseFloat(process.env.MAX_RADIUS_METERS);

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
    
    const status = currentTime > lateTime ? 'terlambat' : 'hadir';

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