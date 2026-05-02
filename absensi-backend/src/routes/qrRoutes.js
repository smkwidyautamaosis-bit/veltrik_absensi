const express = require('express');
const { generateDynamicQR } = require('../controllers/qrController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Hanya admin dan tata_usaha yang bisa memunculkan QR Code di gerbang
router.get('/generate', protect, authorize('admin', 'tata_usaha'), generateDynamicQR);

module.exports = router;