const express = require('express');
const { getNotifications, markAsRead, markAllAsRead, subscribePush } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getNotifications);

router.route('/read-all')
  .put(markAllAsRead);

router.route('/:id/read')
  .put(markAsRead);

router.route('/subscribe')
  .post(subscribePush);

module.exports = router;
