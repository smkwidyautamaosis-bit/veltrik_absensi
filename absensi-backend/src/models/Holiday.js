const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Tanggal libur wajib diisi'],
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Keterangan libur wajib diisi (misal: Libur Nasional, Class Meeting)'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Holiday', holidaySchema);