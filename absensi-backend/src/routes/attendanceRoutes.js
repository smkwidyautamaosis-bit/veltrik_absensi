const express = require('express');
const { checkIn, getHistory, getTodayAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { checkHoliday, checkTimeLimit } = require('../middlewares/attendanceMiddleware');

const router = express.Router();

router.use(protect);

// Siswa melakukan check-in (melewati validasi waktu dan hari libur)
router.post('/checkin', authorize('siswa'), checkTimeLimit, checkHoliday, checkIn);

// Siswa melihat riwayatnya sendiri
router.get('/history', authorize('siswa'), getHistory);

// Admin / Guru melihat absensi hari ini untuk dashboard
router.get('/today', authorize('admin', 'tata_usaha', 'wali_kelas'), getTodayAttendance);

module.exports = router;