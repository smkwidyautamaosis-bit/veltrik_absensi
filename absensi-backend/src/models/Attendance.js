const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userRole: {
      type: String,
      enum: ['siswa', 'guru', 'wali_kelas'],
      default: 'siswa',
    },
    date: {
      type: String, // Format YYYY-MM-DD untuk mempermudah query
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['hadir', 'telat', 'izin', 'sakit', 'alfa'],
      default: 'hadir',
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    distance: {
      type: Number, // Jarak dalam meter dari sekolah
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);