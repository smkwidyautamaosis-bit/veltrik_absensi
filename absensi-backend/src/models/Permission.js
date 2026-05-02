const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: String, // Format YYYY-MM-DD
      required: true,
    },
    endDate: {
      type: String, // Format YYYY-MM-DD
      required: true,
    },
    type: {
      type: String,
      enum: ['sakit', 'izin'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    attachmentUrl: {
      type: String, // Path lokal file (misal: /uploads/nama-file.jpg)
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permission', permissionSchema);
