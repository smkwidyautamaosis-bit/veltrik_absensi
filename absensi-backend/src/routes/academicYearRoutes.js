const express = require('express');
const { getAcademicYears, createAcademicYear, activateAcademicYear, promoteStudents } = require('../controllers/academicYearController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'tata_usaha'));

router.get('/', getAcademicYears);
router.post('/', createAcademicYear);
router.put('/:id/activate', activateAcademicYear);
router.post('/promote', promoteStudents);

module.exports = router;
