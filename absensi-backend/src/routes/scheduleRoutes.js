const express = require('express');
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua route di sini wajib login
router.use(protect);

router.route('/')
  .get(getSchedules)
  .post(authorize('admin', 'tata_usaha'), createSchedule);

router.route('/:id')
  .put(authorize('admin', 'tata_usaha'), updateSchedule)
  .delete(authorize('admin', 'tata_usaha'), deleteSchedule);

module.exports = router;
