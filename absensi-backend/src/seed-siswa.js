require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedSiswa = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Terhubung untuk injeksi data siswa...');

    const existingSiswa = await User.findOne({ email: 'siswa@veltrik.com' });
    if (existingSiswa) {
      console.log('Akun Siswa sudah ada di database!');
      process.exit();
    }

    await User.create({
      name: 'Siswa Percobaan',
      email: 'siswa@veltrik.com',
      phoneNumber: '089876543210',
      password: 'password123',
      role: 'siswa',
      nisn: '1234567890',
      gender: 'Laki-laki',
    });

    console.log('Sukses! Akun Siswa dummy berhasil disuntikkan.');
    process.exit();
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
    process.exit(1);
  }
};

seedSiswa();