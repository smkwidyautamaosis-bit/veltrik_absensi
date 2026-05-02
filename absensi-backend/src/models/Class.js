const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama kelas wajib diisi (misal: X RPL 1)'],
      unique: true,
      trim: true,
    },
    major: {
      type: String,
      required: [true, 'Jurusan wajib diisi'],
      trim: true,
    },
    // Opsional: Untuk menghubungkan ke akun Wali Kelas
    waliKelasId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);