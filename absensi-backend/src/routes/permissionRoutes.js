const express = require('express');
const { 
  submitPermission, 
  getMyPermissions, 
  getClassPermissions, 
  updatePermissionStatus 
} = require('../controllers/permissionController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(protect);

// Rute untuk Siswa
router.post('/', authorize('siswa'), upload.single('attachment'), submitPermission);
router.get('/me', authorize('siswa'), getMyPermissions);

// Rute untuk Wali Kelas
router.get('/class', authorize('wali_kelas', 'admin', 'tata_usaha'), getClassPermissions);
router.put('/:id/status', authorize('wali_kelas', 'admin', 'tata_usaha'), updatePermissionStatus);

module.exports = router;
