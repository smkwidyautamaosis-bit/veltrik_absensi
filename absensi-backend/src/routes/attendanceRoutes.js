const express = require('express');
const { checkIn, getHistory, getTodayAttendance, getReport, updateAttendanceStatus, generateAlpa } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkHoliday, checkTimeLimit } = require('../middlewares/attendanceMiddleware');

const router = express.Router();

router.use(protect);

// Siswa melakukan check-in (melewati validasi waktu dan hari libur)
router.post('/checkin', authorize('siswa', 'guru', 'wali_kelas'), checkTimeLimit, checkHoliday, checkIn);

// Pengguna melihat riwayat absensinya sendiri
router.get('/history', authorize('siswa', 'guru', 'wali_kelas'), getHistory);

// Admin / Guru melihat absensi hari ini untuk dashboard
router.get('/today', authorize('admin', 'tata_usaha', 'wali_kelas'), getTodayAttendance);

// Rute untuk Laporan
router.get('/report', authorize('admin', 'tata_usaha'), getReport);

// Update Status Absensi Manual
router.put('/:id/status', authorize('admin', 'tata_usaha', 'wali_kelas'), updateAttendanceStatus);

// Auto-Alpa Manual Trigger
router.post('/generate-alpa', authorize('admin', 'tata_usaha'), generateAlpa);

module.exports = router;