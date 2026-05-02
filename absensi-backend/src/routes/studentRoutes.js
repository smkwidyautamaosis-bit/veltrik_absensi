const express = require('express');
const { getStudents, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua rute siswa butuh login dan akses khusus Admin / Tata Usaha
router.use(protect);
router.use(authorize('admin', 'tata_usaha'));

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;