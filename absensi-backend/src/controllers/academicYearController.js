const AcademicYear = require('../models/AcademicYear');
const User = require('../models/User');
const Class = require('../models/Class');

// @desc    Get semua Tahun Ajaran
// @route   GET /api/academic-years
exports.getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ year: -1 });
    res.status(200).json({ success: true, data: years });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Tambah Tahun Ajaran Baru
// @route   POST /api/academic-years
exports.createAcademicYear = async (req, res) => {
  try {
    const { year, isActive } = req.body;
    const academicYear = await AcademicYear.create({ year, isActive });
    res.status(201).json({ success: true, data: academicYear });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Set Aktif Tahun Ajaran
// @route   PUT /api/academic-years/:id/activate
exports.activateAcademicYear = async (req, res) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    if (!year) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    year.isActive = true;
    await year.save(); // Hook pre-save will handle deactivating others

    res.status(200).json({ success: true, message: `Tahun ajaran ${year.year} diaktifkan` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Proses Naik Kelas Massal (Promosi)
// @route   POST /api/academic-years/promote
exports.promoteStudents = async (req, res) => {
  try {
    const { targetYearId } = req.body;
    const targetYear = await AcademicYear.findById(targetYearId);
    if (!targetYear) return res.status(404).json({ success: false, message: 'Tahun ajaran target tidak ditemukan' });

    // 1. Ambil semua kelas di tahun ajaran target untuk pemetaan
    const targetClasses = await Class.find({ academicYear: targetYear.year, isDeleted: false });
    const targetClassMap = {}; // Key: "level-name", Value: classId
    targetClasses.forEach(c => {
      targetClassMap[`${c.level}-${c.name}`] = c._id;
    });

    // 2. Ambil semua siswa aktif
    const students = await User.find({ role: 'siswa', studentStatus: 'Aktif' }).populate('classId');
    
    let promotedCount = 0;
    let graduatedCount = 0;
    let failedCount = 0;

    for (const student of students) {
      if (!student.classId) continue;

      const currentLevel = student.classId.level; // X, XI, atau XII
      const className = student.classId.name;

      if (currentLevel === 'XII') {
        // Lulus
        student.studentStatus = 'Alumni';
        await student.save();
        graduatedCount++;
      } else {
        // Naik Kelas
        const nextLevel = currentLevel === 'X' ? 'XI' : 'XII';
        const targetClassId = targetClassMap[`${nextLevel}-${className}`];

        if (targetClassId) {
          student.classId = targetClassId;
          await student.save();
          promotedCount++;
        } else {
          // Kelas target belum dibuat di tahun ajaran baru
          failedCount++;
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Proses kenaikan kelas selesai',
      summary: {
        promoted: promotedCount,
        graduated: graduatedCount,
        skipped: failedCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
