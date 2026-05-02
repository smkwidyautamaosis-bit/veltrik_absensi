const express = require('express');
const { getClasses, createClass, updateClass, deleteClass } = require('../controllers/classController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Semua rute kelas butuh login dan akses khusus Admin / Tata Usaha
router.use(protect);
router.use(authorize('admin', 'tata_usaha'));

router.route('/')
  .get(getClasses)
  .post(createClass);

router.route('/:id')
  .put(updateClass)
  .delete(deleteClass);

module.exports = router;