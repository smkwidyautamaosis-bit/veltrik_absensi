require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // 1. Hubungkan ke database menggunakan URL dari .env
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Terhubung untuk proses injeksi data...');

    // 2. Cek apakah email ini sudah ada agar tidak error duplikat
    const existingAdmin = await User.findOne({ email: 'admin@veltrik.com' });
    if (existingAdmin) {
      console.log('Akun Admin sudah ada di database!');
      process.exit();
    }

    // 3. Buat akun Admin baru
    await User.create({
      name: 'Admin Utama Veltrik',
      email: 'admin@veltrik.com',
      phoneNumber: '081234567890',
      password: 'password123',
      role: 'admin',
    });

    console.log('Sukses! Akun Admin dummy berhasil disuntikkan ke database.');
    process.exit();
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
    process.exit(1);
  }
};

seedAdmin();