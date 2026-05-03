const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tahun Ajaran wajib diisi (misal: 2024/2025)'],
      unique: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: [true, 'Tanggal mulai tahun ajaran wajib diisi'],
    },
    endDate: {
      type: Date,
      required: [true, 'Tanggal selesai tahun ajaran wajib diisi'],
    }
  },
  { timestamps: true }
);

// Pastikan hanya ada satu tahun ajaran aktif pada satu waktu
academicYearSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

module.exports = mongoose.model('AcademicYear', academicYearSchema);
