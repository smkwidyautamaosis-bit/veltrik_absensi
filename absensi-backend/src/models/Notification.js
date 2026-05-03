const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '', // Contoh: '/dashboard' atau '/schedules'
    },
    relatedData: {
      type: Object, // Bermanfaat untuk menyimpan ID pengajuan izin dll
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
