const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama wajib diisi'],
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Format email tidak valid'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Nomor telepon wajib diisi untuk keperluan kontak'],
    },
    password: {
      type: String,
      required: [true, 'Password wajib diisi'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'kepala_sekolah', 'wali_kelas', 'tata_usaha', 'guru', 'siswa', 'orang_tua'],
      default: 'siswa',
    },
    nisn: {
      type: String,
      unique: true,
      sparse: true, 
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    gender: {
      type: String,
      enum: ['Laki-laki', 'Perempuan'],
    },
    address: {
      type: String,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Hanya diisi jika role === 'siswa'
    },
    studentStatus: {
      type: String,
      enum: ['Aktif', 'Pindahan', 'Alumni'],
      default: 'Aktif',
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    previousSchool: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password sebelum di-save (Telah diperbarui tanpa menggunakan next())
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Langsung return tanpa next()
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method untuk membandingkan password saat login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);