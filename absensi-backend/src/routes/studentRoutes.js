const express = require('express');
const multer = require('multer');
const { getTemplate, previewImport, confirmImport, getStudents } = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);

router.get('/', authorize('admin', 'tata_usaha', 'wali_kelas'), getStudents);
router.get('/template', authorize('admin', 'tata_usaha'), getTemplate);
router.post('/import', authorize('admin', 'tata_usaha'), upload.single('file'), previewImport);
router.post('/import/confirm', authorize('admin', 'tata_usaha'), confirmImport);

module.exports = router;