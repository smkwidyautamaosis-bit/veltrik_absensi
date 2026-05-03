const express = require('express');
const { getParents, createParent, getChildren, linkStudent, unlinkStudent } = require('../controllers/parentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin', 'tata_usaha'), getParents)
  .post(authorize('admin', 'tata_usaha'), createParent);

// Endpoint children bisa diakses oleh TU, Admin, atau Orang Tua itu sendiri
router.route('/:id/children')
  .get(authorize('admin', 'tata_usaha', 'orang_tua'), getChildren);

router.route('/:id/link-student')
  .post(authorize('admin', 'tata_usaha'), linkStudent);

router.route('/:id/unlink-student')
  .post(authorize('admin', 'tata_usaha'), unlinkStudent);

module.exports = router;
