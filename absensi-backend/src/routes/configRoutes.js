const express = require('express');
const { getConfig, updateConfig } = require('../controllers/configController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// GET config can be accessed by authenticated users (or maybe just admin/TU)
// But wait, the frontend settings page will fetch it. Admin & TU only.
router.route('/')
  .get(protect, authorize('admin', 'tata_usaha'), getConfig)
  .put(protect, authorize('admin', 'tata_usaha'), updateConfig);

module.exports = router;
