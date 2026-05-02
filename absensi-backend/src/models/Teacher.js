const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama guru wajib diisi']
  },
  nip: {
    type: String,
    required: [true, 'NIP wajib diisi'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Nomor HP wajib diisi']
  },
  gender: {
    type: String,
    enum: ['Laki-laki', 'Perempuan'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);