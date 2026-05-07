const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getPKL, createPKL, updatePKL, deletePKL, endPKL } = require('../controllers/pklController');

const router = express.Router();

router.use(protect, authorize('admin', 'tata_usaha'));

router.route('/')
  .get(getPKL)
  .post(createPKL);

router.route('/:id')
  .put(updatePKL)
  .delete(deletePKL);

router.put('/:id/end', endPKL);

module.exports = router;
