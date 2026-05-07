const mongoose = require('mongoose');

const pklSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Kelas wajib dipilih'],
    },
    startDate: {
      type: Date,
      required: [true, 'Tanggal mulai PKL wajib diisi'],
    },
    endDate: {
      type: Date,
      required: [true, 'Tanggal selesai PKL wajib diisi'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PKL', pklSchema);
