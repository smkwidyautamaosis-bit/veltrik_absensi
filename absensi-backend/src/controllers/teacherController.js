const Teacher = require('../models/Teacher');

// @desc    Ambil semua data guru
// @route   GET /api/teachers
exports.getTeachers = async (req, res, next) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    next(error);
  }
};

// @desc    Tambah guru baru
// @route   POST /api/teachers
exports.createTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.create(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    // Tangani error jika NIP atau Email sudah terdaftar
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'NIP atau Email sudah terdaftar' });
    }
    next(error);
  }
};

// @desc    Hapus data guru
// @route   DELETE /api/teachers/:id
exports.deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ success: false, message: 'Data guru tidak ditemukan' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};