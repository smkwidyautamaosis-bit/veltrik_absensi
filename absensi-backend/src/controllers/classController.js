const Class = require('../models/Class');
const User = require('../models/User');

// @desc    Get semua kelas (aktif)
// @route   GET /api/classes
exports.getClasses = async (req, res, next) => {
  try {
    let query = { isDeleted: false };
    
    if (req.query.tahun) {
      query.academicYear = req.query.tahun;
    }
    if (req.query.archived === 'true') {
      query.isArchived = true;
    } else {
      query.isArchived = false;
    }

    const classes = await Class.find(query).populate('waliKelasId', 'name email').sort({ academicYear: -1, name: 1 });
    res.status(200).json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detail kelas
// @route   GET /api/classes/:id
exports.getClass = async (req, res, next) => {
  try {
    const classDetail = await Class.findById(req.params.id).populate('waliKelasId', 'name email');
    if (!classDetail) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });
    res.status(200).json({ success: true, data: classDetail });
  } catch (error) {
    next(error);
  }
};

// @desc    Buat kelas baru
// @route   POST /api/classes
exports.createClass = async (req, res, next) => {
  try {
    const { name, major, level, academicYear, capacity, waliKelasId } = req.body;

    // Cek duplikasi nama kelas di tahun ajaran yang sama
    const existingClass = await Class.findOne({ name, academicYear, isDeleted: false });
    if (existingClass) {
      return res.status(400).json({ success: false, message: `Kelas dengan nama ${name} sudah ada di tahun ajaran ${academicYear}` });
    }

    // Validasi wali kelas (tidak boleh double job di tahun ajaran yang sama jika belum diarsip)
    if (waliKelasId) {
      const activeWaliKelas = await Class.findOne({ waliKelasId, academicYear, isArchived: false, isDeleted: false });
      if (activeWaliKelas) {
        return res.status(400).json({ success: false, message: 'Wali kelas ini sudah memegang kelas aktif lain di tahun ajaran yang sama' });
      }
    }

    const newClass = await Class.create({ name, major, level, academicYear, capacity, waliKelasId });
    res.status(201).json({ success: true, message: 'Kelas berhasil dibuat', data: newClass });
  } catch (error) {
    next(error);
  }
};

// @desc    Update kelas
// @route   PUT /api/classes/:id
exports.updateClass = async (req, res, next) => {
  try {
    const { name, major, level, academicYear, capacity, waliKelasId } = req.body;
    
    const targetClass = await Class.findById(req.params.id);
    if (!targetClass) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });

    // Cek duplikasi jika nama atau tahun ajaran berubah
    if (name !== targetClass.name || academicYear !== targetClass.academicYear) {
      const existingClass = await Class.findOne({ name: name || targetClass.name, academicYear: academicYear || targetClass.academicYear, _id: { $ne: targetClass._id }, isDeleted: false });
      if (existingClass) {
        return res.status(400).json({ success: false, message: `Kelas dengan nama tersebut sudah ada di tahun ajaran itu` });
      }
    }

    // Validasi wali kelas baru
    if (waliKelasId && String(waliKelasId) !== String(targetClass.waliKelasId)) {
      const activeWaliKelas = await Class.findOne({ waliKelasId, academicYear: academicYear || targetClass.academicYear, isArchived: false, isDeleted: false });
      if (activeWaliKelas) {
        return res.status(400).json({ success: false, message: 'Wali kelas ini sudah memegang kelas aktif lain di tahun ajaran yang sama' });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    res.status(200).json({ success: true, message: 'Kelas berhasil diupdate', data: updatedClass });
  } catch (error) {
    next(error);
  }
};

// @desc    Hapus kelas (soft delete)
// @route   DELETE /api/classes/:id
exports.deleteClass = async (req, res, next) => {
  try {
    const targetClass = await Class.findById(req.params.id);
    if (!targetClass) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });

    targetClass.isDeleted = true;
    await targetClass.save();

    res.status(200).json({ success: true, message: 'Kelas berhasil dihapus', data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Arsipkan kelas
// @route   PUT /api/classes/:id/archive
exports.archiveClass = async (req, res, next) => {
  try {
    const targetClass = await Class.findById(req.params.id);
    if (!targetClass) return res.status(404).json({ success: false, message: 'Kelas tidak ditemukan' });

    targetClass.isArchived = true;
    await targetClass.save();

    res.status(200).json({ success: true, message: 'Kelas berhasil diarsipkan', data: targetClass });
  } catch (error) {
    next(error);
  }
};

// @desc    Lihat siswa di kelas ini
// @route   GET /api/classes/:id/students
exports.getClassStudents = async (req, res, next) => {
  try {
    const students = await User.find({ classId: req.params.id, role: 'siswa' });
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};