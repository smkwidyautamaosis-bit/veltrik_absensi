const Subject = require('../models/Subject');

// @desc    Get all subjects (with optional filters)
// @route   GET /api/subjects
exports.getSubjects = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.level && req.query.level !== 'Semua') {
      query.$or = [{ level: req.query.level }, { level: 'Semua' }];
    }
    if (req.query.major && req.query.major !== 'Semua') {
      query.$or = query.$or
        ? [{ $and: [{ $or: query.$or }, { $or: [{ major: req.query.major }, { major: 'Semua' }] }] }]
        : [{ major: req.query.major }, { major: 'Semua' }];
      // Simplify: just use both conditions
      delete query.$or;
      const levelFilter = req.query.level && req.query.level !== 'Semua'
        ? { $in: [req.query.level, 'Semua'] }
        : undefined;
      const majorFilter = { $in: [req.query.major, 'Semua'] };
      
      if (levelFilter) query.level = levelFilter;
      query.major = majorFilter;
    } else if (req.query.level && req.query.level !== 'Semua') {
      query.level = { $in: [req.query.level, 'Semua'] };
    }

    const subjects = await Subject.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
exports.createSubject = async (req, res, next) => {
  try {
    const { name, code, level, major } = req.body;

    // Cek duplikasi nama
    const existing = await Subject.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Mata pelajaran dengan nama ini sudah ada' });
    }

    const subject = await Subject.create({ name, code, level, major });
    res.status(201).json({ success: true, message: 'Mata pelajaran berhasil ditambahkan', data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
    }

    res.status(200).json({ success: true, message: 'Mata pelajaran berhasil diupdate', data: subject });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
exports.deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Mata pelajaran tidak ditemukan' });
    }

    await Subject.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Mata pelajaran berhasil dihapus', data: {} });
  } catch (error) {
    next(error);
  }
};
