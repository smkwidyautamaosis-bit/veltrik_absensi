const express = require('express');
const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

// GET bisa diakses semua yang login (guru perlu lihat mapel juga)
router.get('/', getSubjects);

// CUD hanya admin & tata_usaha
router.post('/', authorize('admin', 'tata_usaha'), createSubject);
router.put('/:id', authorize('admin', 'tata_usaha'), updateSubject);
router.delete('/:id', authorize('admin', 'tata_usaha'), deleteSubject);

module.exports = router;
