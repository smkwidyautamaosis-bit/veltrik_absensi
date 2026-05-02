const Holiday = require('../models/Holiday');

// Middleware Cek Hari Libur
const checkHoliday = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isHoliday = await Holiday.findOne({ date: today });
    if (isHoliday) {
      return res.status(403).json({
        success: false,
        message: `Absensi ditolak. Hari ini adalah hari libur: ${isHoliday.description}`,
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware Cek Waktu Absensi
const checkTimeLimit = (req, res, next) => {
  const now = new Date();
  const currentTime = now.toTimeString().substring(0, 5); // Format HH:MM

  const startTime = process.env.ATTENDANCE_START_TIME || '06:00';
  const endTime = process.env.ATTENDANCE_END_TIME || '15:00';

  if (currentTime < startTime || currentTime > endTime) {
    return res.status(403).json({
      success: false,
      message: `Absensi hanya dapat dilakukan antara pukul ${startTime} hingga ${endTime}`,
    });
  }
  next();
};

module.exports = { checkHoliday, checkTimeLimit };