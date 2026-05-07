const User = require('../models/User');

// @desc    Get all users (with optional role filter)
// @route   GET /api/users
exports.getUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role) {
      query.role = req.query.role;
    }
    
    // Populate classId if exist (for students/teachers)
    const users = await User.find(query).populate('classId', 'name major academicYear').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new user
// @route   POST /api/users
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, nisn, classId, gender, phoneNumber, address, teacherType } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    if (nisn) {
      const nisnExists = await User.findOne({ nisn });
      if (nisnExists) {
        return res.status(400).json({ success: false, message: 'NISN sudah terdaftar' });
      }
    }

    const user = await User.create({
      name, email, password, role, nisn, classId, gender, phoneNumber, address, teacherType
    });

    res.status(201).json({ success: true, message: 'User berhasil dibuat', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    // Prevent updating password via this endpoint
    const { password, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('classId', 'name major');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.status(200).json({ success: true, message: 'User berhasil diupdate', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Jika yang dihapus adalah orang tua, bersihkan parentId di semua siswanya
    if (user.role === 'orang_tua') {
      await User.updateMany({ parentId: user._id }, { $set: { parentId: null } });
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ success: true, message: 'User berhasil dihapus', data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user role
// @route   GET /api/users/:id/role
exports.getUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.status(200).json({ success: true, role: user.role });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role wajib diisi' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.status(200).json({ success: true, message: 'Role user berhasil diupdate', data: user });
  } catch (error) {
    next(error);
  }
};
