const Notification = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');

// @desc    Mendapatkan semua notifikasi user (urut terbaru)
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50); // Batasi 50 terbaru untuk performa
    res.status(200).json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Menandai 1 notifikasi telah dibaca
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, error: 'Notifikasi tidak ditemukan' });
    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Menandai SEMUA notifikasi telah dibaca
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Menyimpan Push Subscription (dari Service Worker)
// @route   POST /api/notifications/subscribe
exports.subscribePush = async (req, res) => {
  try {
    const subscription = req.body;
    
    // Cek apakah langganan ini sudah ada (hindari duplicate)
    const existing = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    
    if (existing) {
      if (existing.user.toString() !== req.user._id.toString()) {
        // Jika beda user (misal HP dipakai bergantian), update user nya
        existing.user = req.user._id;
        await existing.save();
      }
      return res.status(200).json({ success: true, message: 'Sudah berlangganan' });
    }

    await PushSubscription.create({
      user: req.user._id,
      subscription
    });

    res.status(201).json({ success: true, message: 'Langganan berhasil' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
