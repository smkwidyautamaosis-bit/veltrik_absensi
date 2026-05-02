const Holiday = require('../models/Holiday');

// @desc    Tambah hari libur
// @route   POST /api/holidays
exports.createHoliday = async (req, res, next) => {
  try {
    const { date, description } = req.body;
    const holidayDate = new Date(date);
    holidayDate.setHours(0, 0, 0, 0);

    const holiday = await Holiday.create({ date: holidayDate, description });
    res.status(201).json({ success: true, data: holiday });
  } catch (error) {
    next(error);
  }
};

// @desc    Daftar hari libur
// @route   GET /api/holidays
exports.getHolidays = async (req, res, next) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });
    res.status(200).json({ success: true, data: holidays });
  } catch (error) {
    next(error);
  }
};