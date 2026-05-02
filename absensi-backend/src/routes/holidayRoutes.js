const express = require('express');
const { createHoliday, getHolidays } = require('../controllers/holidayController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getHolidays);
// Hanya admin/tata_usaha yang bisa set hari libur
router.post('/', authorize('admin', 'tata_usaha'), createHoliday);

module.exports = router;