const Class = require('../models/Class');

// @desc    Get semua kelas
// @route   GET /api/classes
exports.getClasses = async (req, res, next) => {
  try {
    const classes = await Class.find().populate('waliKelasId', 'name email');
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    next(error);
  }
};

// @desc    Buat kelas baru
// @route   POST /api/classes
exports.createClass = async (req, res, next) => {
  try {
    const { name, major, waliKelasId } = req.body;
    const newClass = await Class.create({ name, major, waliKelasId });
    res.status(201).json({ success: true, message: 'Kelas berhasil dibuat', data: newClass });
  } catch (error) {
    next(error);
  }
};

// @desc    Update kelas
// @route   PUT /api/classes/:id
exports.updateClass = async (req, res, next) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedClass) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    res.status(200).json({ success: true, message: 'Kelas berhasil diupdate', data: updatedClass });
  } catch (error) {
    next(error);
  }
};

// @desc    Hapus kelas
// @route   DELETE /api/classes/:id
exports.deleteClass = async (req, res, next) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    if (!deletedClass) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    res.status(200).json({ success: true, message: 'Kelas berhasil dihapus', data: {} });
  } catch (error) {
    next(error);
  }
};