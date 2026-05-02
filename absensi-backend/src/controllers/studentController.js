const User = require('../models/User');

// @desc    Get semua siswa dengan Search & Pagination
// @route   GET /api/students
exports.getStudents = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, classId } = req.query;

    // Build Query
    const query = { role: 'siswa' };
    
    // Pencarian berdasarkan Nama atau NISN
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nisn: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter berdasarkan kelas
    if (classId) {
      query.classId = classId;
    }

    // Pagination logic
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);

    const students = await User.find(query)
      .populate('classId', 'name major')
      .skip(startIndex)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tambah siswa baru
// @route   POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    // Memaksa role menjadi siswa
    const studentData = { ...req.body, role: 'siswa' };
    const student = await User.create(studentData);
    
    // Hapus password dari response demi keamanan
    student.password = undefined; 

    res.status(201).json({ success: true, message: 'Data siswa berhasil ditambahkan', data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Update data siswa
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    // Jika password ikut diupdate, kita butuh trigger `save` agar di-hash
    let student = await User.findById(req.params.id);
    if (!student || student.role !== 'siswa') {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }

    // Update field
    const fieldsToUpdate = ['name', 'email', 'phoneNumber', 'nisn', 'classId', 'gender', 'address'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) student[field] = req.body[field];
    });

    if (req.body.password) {
      student.password = req.body.password;
    }

    await student.save();
    student.password = undefined; // Sembunyikan di response

    res.status(200).json({ success: true, message: 'Data siswa berhasil diupdate', data: student });
  } catch (error) {
    next(error);
  }
};

// @desc    Hapus data siswa
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'siswa' });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });
    }
    res.status(200).json({ success: true, message: 'Data siswa berhasil dihapus', data: {} });
  } catch (error) {
    next(error);
  }
};