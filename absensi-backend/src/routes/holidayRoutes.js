const express = require('express');
const { createHoliday, getHolidays, syncNationalHolidays, deleteHoliday } = require('../controllers/holidayController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('admin', 'tata_usaha'), createHoliday)
  .get(protect, getHolidays);

router.route('/sync')
  .post(protect, authorize('admin', 'tata_usaha'), syncNationalHolidays);

router.route('/:id')
  .delete(protect, authorize('admin', 'tata_usaha'), deleteHoliday);

module.exports = router;