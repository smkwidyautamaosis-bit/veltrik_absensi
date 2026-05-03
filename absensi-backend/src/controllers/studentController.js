const ExcelJS = require('exceljs');
const User = require('../models/User');
const Class = require('../models/Class');
const bcrypt = require('bcryptjs');

// @desc    Download Template Excel Siswa
// @route   GET /api/students/template
exports.getTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Siswa');
    const guideSheet = workbook.addWorksheet('Panduan');

    // 1. Setup Sheet Data Siswa
    sheet.columns = [
      { header: 'NISN', key: 'nisn', width: 20 },
      { header: 'Nama Lengkap', key: 'name', width: 30 },
      { header: 'Kelas', key: 'className', width: 20 },
      { header: 'Tingkat', key: 'level', width: 10 },
      { header: 'Jenis Kelamin', key: 'gender', width: 15 },
      { header: 'No HP', key: 'phoneNumber', width: 20 },
    ];

    // Styling Header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Baris Contoh (Abu-abu / Italic)
    const exampleRow = sheet.addRow({
      nisn: '242510001',
      name: 'Sandi Nutrya (CONTOH)',
      className: 'Perhotelan 1',
      level: 'X',
      gender: 'L',
      phoneNumber: '08123456789'
    });
    exampleRow.font = { italic: true, color: { argb: 'FF808080' } };

    // 2. Setup Sheet Panduan
    guideSheet.columns = [
      { header: 'Kolom', key: 'column', width: 20 },
      { header: 'Keterangan', key: 'desc', width: 60 },
    ];
    guideSheet.getRow(1).font = { bold: true };

    guideSheet.addRows([
      { column: 'NISN', desc: 'Wajib diisi, unik, tidak boleh duplikat.' },
      { column: 'Nama Lengkap', desc: 'Wajib diisi.' },
      { column: 'Kelas', desc: 'Wajib diisi, sesuai nama kelas di sistem (Contoh: Perhotelan 1).' },
      { column: 'Tingkat', desc: 'Wajib diisi, pilih: X, XI, atau XII.' },
      { column: 'Jenis Kelamin', desc: 'Wajib diisi, isi L untuk Laki-laki atau P untuk Perempuan.' },
      { column: 'No HP', desc: 'Opsional.' },
    ]);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_Siswa.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Upload & Preview Import Siswa
// @route   POST /api/students/import
exports.previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Harap upload file excel' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.getWorksheet('Data Siswa');

    if (!sheet) {
      return res.status(400).json({ success: false, message: 'Sheet "Data Siswa" tidak ditemukan' });
    }

    const data = [];
    const nisnListInFile = new Set();
    
    // Ambil semua kelas untuk validasi
    const allClasses = await Class.find({ isDeleted: false });
    const classMap = {};
    allClasses.forEach(c => {
      classMap[c.name.toLowerCase()] = c;
    });

    // Ambil semua NISN yang sudah ada di DB
    const existingUsers = await User.find({ role: 'siswa' }).select('nisn');
    const dbNisnSet = new Set(existingUsers.map(u => u.nisn));

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1 || rowNumber === 2) return; // Skip header and example

      const nisn = row.getCell(1).text?.toString()?.trim();
      const name = row.getCell(2).text?.toString()?.trim();
      const className = row.getCell(3).text?.toString()?.trim();
      const level = row.getCell(4).text?.toString()?.trim()?.toUpperCase();
      const genderRaw = row.getCell(5).text?.toString()?.trim()?.toUpperCase();
      const phoneNumber = row.getCell(6).text?.toString()?.trim();

      const errors = [];
      const warnings = [];

      // Validasi NISN
      if (!nisn) {
        errors.push('NISN tidak boleh kosong');
      } else if (dbNisnSet.has(nisn)) {
        errors.push('NISN sudah terdaftar di database');
      } else if (nisnListInFile.has(nisn)) {
        errors.push('NISN duplikat di dalam file');
      } else {
        nisnListInFile.add(nisn);
      }

      // Validasi Nama
      if (!name) errors.push('Nama tidak boleh kosong');

      // Validasi Kelas
      let classId = null;
      if (!className) {
        errors.push('Kelas tidak boleh kosong');
      } else {
        const foundClass = classMap[className.toLowerCase()];
        if (!foundClass) {
          errors.push(`Kelas "${className}" tidak terdaftar di sistem`);
        } else {
          classId = foundClass._id;
        }
      }

      // Validasi Tingkat
      if (!level) {
        errors.push('Tingkat tidak boleh kosong');
      } else if (!['X', 'XI', 'XII'].includes(level)) {
        errors.push('Tingkat harus X, XI, atau XII');
      }

      // Validasi Gender
      let gender = '';
      if (!genderRaw) {
        errors.push('Jenis Kelamin tidak boleh kosong');
      } else if (genderRaw === 'L') {
        gender = 'Laki-laki';
      } else if (genderRaw === 'P') {
        gender = 'Perempuan';
      } else {
        errors.push('Jenis Kelamin harus L atau P');
      }

      // Warning
      if (!phoneNumber) warnings.push('No HP kosong');

      const status = errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'valid');

      data.push({
        row: rowNumber,
        nisn,
        name,
        className,
        classId,
        level,
        gender,
        phoneNumber,
        status,
        errors,
        warnings
      });
    });

    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Konfirmasi Import Siswa
// @route   POST /api/students/import/confirm
exports.confirmImport = async (req, res) => {
  try {
    const { students } = req.body; // Array data valid

    if (!students || !Array.isArray(students)) {
      return res.status(400).json({ success: false, message: 'Data tidak valid' });
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Masuk123', salt);

    const importData = students.map(s => ({
      name: s.name,
      nisn: s.nisn,
      email: `${s.nisn}@smkwidyautama.sch.id`,
      password: defaultPassword,
      phoneNumber: s.phoneNumber || '-',
      gender: s.gender,
      classId: s.classId,
      role: 'siswa',
      studentStatus: 'Aktif',
      joinDate: new Date()
    }));

    await User.insertMany(importData);

    res.status(201).json({ success: true, message: `${importData.length} siswa berhasil diimport` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get semua siswa (Existing logic if needed)
exports.getStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'siswa' }).populate('classId', 'name level major');
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    next(error);
  }
};