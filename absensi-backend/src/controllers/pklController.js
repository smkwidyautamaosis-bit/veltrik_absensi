const PKL = require('../models/PKL');
const Class = require('../models/Class');

const normalizeDate = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const ensureClassXII = async (classId) => {
  const classData = await Class.findById(classId);
  if (!classData) {
    return { valid: false, message: 'Kelas tidak ditemukan' };
  }
  if (classData.level !== 'XII') {
    return { valid: false, message: 'PKL hanya berlaku untuk kelas XII' };
  }
  return { valid: true };
};

exports.getPKL = async (req, res, next) => {
  try {
    const periods = await PKL.find({})
      .populate('classId', 'name major level academicYear')
      .sort({ startDate: -1 });

    res.status(200).json({ success: true, data: periods });
  } catch (error) {
    next(error);
  }
};

exports.createPKL = async (req, res, next) => {
  try {
    const { classId, startDate, endDate, description } = req.body;
    const classCheck = await ensureClassXII(classId);
    if (!classCheck.valid) {
      return res.status(400).json({ success: false, message: classCheck.message });
    }

    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    if (end < start) {
      return res.status(400).json({ success: false, message: 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai' });
    }

    const created = await PKL.create({
      classId,
      startDate: start,
      endDate: end,
      isActive: end >= normalizeDate(new Date()),
      description: description || '',
    });

    const populated = await PKL.findById(created._id).populate('classId', 'name major level academicYear');
    res.status(201).json({ success: true, message: 'Periode PKL berhasil dibuat', data: populated });
  } catch (error) {
    next(error);
  }
};

exports.updatePKL = async (req, res, next) => {
  try {
    const { classId, startDate, endDate, description, isActive } = req.body;
    const period = await PKL.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ success: false, message: 'Periode PKL tidak ditemukan' });
    }

    const targetClassId = classId || period.classId;
    const classCheck = await ensureClassXII(targetClassId);
    if (!classCheck.valid) {
      return res.status(400).json({ success: false, message: classCheck.message });
    }

    const nextStart = startDate ? normalizeDate(startDate) : period.startDate;
    const nextEnd = endDate ? normalizeDate(endDate) : period.endDate;
    if (nextEnd < nextStart) {
      return res.status(400).json({ success: false, message: 'Tanggal selesai tidak boleh lebih kecil dari tanggal mulai' });
    }

    period.classId = targetClassId;
    period.startDate = nextStart;
    period.endDate = nextEnd;
    period.description = description !== undefined ? description : period.description;
    period.isActive = isActive !== undefined ? Boolean(isActive) : period.isActive;
    await period.save();

    const populated = await PKL.findById(period._id).populate('classId', 'name major level academicYear');
    res.status(200).json({ success: true, message: 'Periode PKL berhasil diperbarui', data: populated });
  } catch (error) {
    next(error);
  }
};

exports.deletePKL = async (req, res, next) => {
  try {
    const period = await PKL.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ success: false, message: 'Periode PKL tidak ditemukan' });
    }
    await period.deleteOne();
    res.status(200).json({ success: true, message: 'Periode PKL berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

exports.endPKL = async (req, res, next) => {
  try {
    const period = await PKL.findById(req.params.id);
    if (!period) {
      return res.status(404).json({ success: false, message: 'Periode PKL tidak ditemukan' });
    }

    period.isActive = false;
    period.endDate = normalizeDate(new Date());
    await period.save();

    const populated = await PKL.findById(period._id).populate('classId', 'name major level academicYear');
    res.status(200).json({ success: true, message: 'Periode PKL berhasil diakhiri', data: populated });
  } catch (error) {
    next(error);
  }
};
