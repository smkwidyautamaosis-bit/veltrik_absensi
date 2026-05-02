const Schedule = require('../models/Schedule');

// @desc    Mendapatkan daftar jadwal pelajaran
// @route   GET /api/schedules
exports.getSchedules = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.teacher) query.teacher = req.query.teacher;
    if (req.query.classId) query.classId = req.query.classId;
    if (req.query.dayOfWeek) query.dayOfWeek = req.query.dayOfWeek;

    const schedules = await Schedule.find(query)
      .populate('teacher', 'name email')
      .populate('classId', 'name major level academicYear')
      .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Membuat jadwal baru
// @route   POST /api/schedules
exports.createSchedule = async (req, res, next) => {
  try {
    const { teacher, classId, subject, dayOfWeek, startTime, endTime } = req.body;

    // TODO: Tambahkan validasi bentrok jadwal di sini jika perlu

    const schedule = await Schedule.create({
      teacher,
      classId,
      subject,
      dayOfWeek,
      startTime,
      endTime
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('teacher', 'name email')
      .populate('classId', 'name major');

    res.status(201).json({ success: true, data: populatedSchedule });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Jadwal bentrok: Guru sudah memiliki jadwal di jam dan hari tersebut.' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update jadwal
// @route   PUT /api/schedules/:id
exports.updateSchedule = async (req, res, next) => {
  try {
    let schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Jadwal tidak ditemukan' });
    }

    schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('teacher', 'name email').populate('classId', 'name major');

    res.status(200).json({ success: true, data: schedule });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Jadwal bentrok dengan jadwal lain.' });
    }
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Hapus jadwal
// @route   DELETE /api/schedules/:id
exports.deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ success: false, error: 'Jadwal tidak ditemukan' });
    }
    await schedule.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
