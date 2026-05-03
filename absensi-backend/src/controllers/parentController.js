const User = require('../models/User');

// @desc    Mendapatkan daftar semua Orang Tua
// @route   GET /api/parents
exports.getParents = async (req, res, next) => {
  try {
    const parents = await User.find({ role: 'orang_tua' }).sort({ name: 1 });
    res.status(200).json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    next(error);
  }
};

// @desc    Membuat akun Orang Tua baru
// @route   POST /api/parents
exports.createParent = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, address } = req.body;
    const parent = await User.create({
      name, email, phoneNumber, password, address, role: 'orang_tua'
    });
    res.status(201).json({ success: true, data: parent });
  } catch (error) {
    next(error);
  }
};

// @desc    Mengambil data anak-anak (siswa) yang terhubung
// @route   GET /api/parents/:id/children
exports.getChildren = async (req, res, next) => {
  try {
    const parentId = req.params.id;
    
    // Keamanan: Jika yang akses adalah orang tua, dia hanya boleh akses ID-nya sendiri
    if (req.user.role === 'orang_tua' && req.user._id.toString() !== parentId) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke data ini' });
    }

    // Ambil data siswa beserta relasi kelasnya
    const children = await User.find({ role: 'siswa', parentId }).populate('classId', 'name major level');
    
    // Untuk masing-masing anak, kita juga ambil data wali kelasnya agar bisa ditampilkan
    const childrenWithWali = await Promise.all(children.map(async (child) => {
      let waliKelasName = '-';
      if (child.classId) {
        const wali = await User.findOne({ role: 'wali_kelas', classId: child.classId._id });
        if (wali) waliKelasName = wali.name;
      }
      return { ...child.toObject(), waliKelasName };
    }));

    res.status(200).json({ success: true, data: childrenWithWali });
  } catch (error) {
    next(error);
  }
};

// @desc    Menautkan Siswa ke Orang Tua
// @route   POST /api/parents/:id/link-student
exports.linkStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const parentId = req.params.id;

    // Pastikan siswa ada
    const student = await User.findOne({ _id: studentId, role: 'siswa' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan' });
    }

    // Pastikan orang tua ada
    const parent = await User.findOne({ _id: parentId, role: 'orang_tua' });
    if (!parent) {
      return res.status(404).json({ success: false, message: 'Data orang tua tidak ditemukan' });
    }

    // Validasi: Apakah siswa sudah ditautkan ke akun lain?
    if (student.parentId && student.parentId.toString() !== parentId) {
      return res.status(400).json({ success: false, message: 'Siswa ini sudah tertaut dengan akun orang tua lain. Lepaskan tautan terlebih dahulu.' });
    }

    student.parentId = parentId;
    await student.save();

    res.status(200).json({ success: true, message: 'Siswa berhasil ditautkan ke Orang Tua', data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Melepaskan Tautan Siswa dari Orang Tua
// @route   POST /api/parents/:id/unlink-student
exports.unlinkStudent = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    
    const student = await User.findOne({ _id: studentId, role: 'siswa', parentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Tautan siswa tidak ditemukan' });
    }

    student.parentId = null;
    await student.save();

    res.status(200).json({ success: true, message: 'Tautan siswa berhasil dilepas' });
  } catch (error) {
    next(error);
  }
};
