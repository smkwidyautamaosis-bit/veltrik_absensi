const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama mata pelajaran wajib diisi'],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      default: null,
    },
    level: {
      type: String,
      enum: ['X', 'XI', 'XII', 'Semua'],
      default: 'Semua',
    },
    major: {
      type: String,
      enum: ['Perhotelan', 'Tata Boga', 'Pariwisata', 'Perbankan', 'Semua'],
      default: 'Semua',
    },
  },
  { timestamps: true }
);

// Index untuk pencarian cepat
subjectSchema.index({ name: 1 });
subjectSchema.index({ level: 1, major: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
