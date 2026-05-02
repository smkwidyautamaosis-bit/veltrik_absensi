const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama kelas wajib diisi (misal: Perhotelan 1)'],
      trim: true,
    },
    major: {
      type: String,
      required: [true, 'Jurusan wajib diisi (misal: Perhotelan)'],
      trim: true,
    },
    level: {
      type: String,
      enum: ['X', 'XI', 'XII'],
      required: [true, 'Tingkat kelas wajib diisi'],
    },
    academicYear: {
      type: String,
      required: [true, 'Tahun ajaran wajib diisi (misal: 2024/2025)'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Kapasitas kelas wajib diisi'],
      default: 36,
    },
    waliKelasId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Mencegah duplikasi nama kelas di tahun ajaran yang sama,
// tapi memperbolehkan nama kelas yang sama di tahun ajaran berbeda
classSchema.index({ name: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);