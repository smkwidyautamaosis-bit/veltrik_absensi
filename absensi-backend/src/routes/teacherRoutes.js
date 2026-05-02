const express = require('express');
const { getTeachers, createTeacher, deleteTeacher } = require('../controllers/teacherController');

// PERBAIKAN: Mengubah 'middleware' menjadi 'middlewares' 
// dan menyesuaikan nama file menjadi 'authMiddleware'
const { protect, authorize } = require('../middlewares/authMiddleware'); 

const router = express.Router();

// Semua rute di bawah ini wajib login dan hanya untuk admin/tata_usaha
router.use(protect);
router.use(authorize('admin', 'tata_usaha'));

router.route('/')
  .get(getTeachers)
  .post(createTeacher);

router.route('/:id')
  .delete(deleteTeacher);

module.exports = router;