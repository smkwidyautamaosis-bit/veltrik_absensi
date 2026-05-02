const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Fungsi bantuan untuk generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register user baru
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, phoneNumber, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const user = await User.create({
      name,
      email,
      phoneNumber,
      password,
      role
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber, token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Masukkan email dan password' });
    }

    // Ambil user beserta password (karena di schema kita set select: false)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get data user yang sedang login
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    // req.user sudah di-set oleh middleware protect
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};