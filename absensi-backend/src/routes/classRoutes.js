const express = require('express');
const { getClasses, getClass, createClass, updateClass, deleteClass, archiveClass, getClassStudents } = require('../controllers/classController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua rute kelas butuh login dan akses khusus Admin / Tata Usaha
router.use(protect);
router.use(authorize('admin', 'tata_usaha'));

router.route('/')
  .get(getClasses)
  .post(createClass);

router.route('/:id')
  .get(getClass)
  .put(updateClass)
  .delete(deleteClass);

router.route('/:id/archive')
  .put(archiveClass);

router.route('/:id/students')
  .get(getClassStudents);

module.exports = router;