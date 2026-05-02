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

// @desc    Sync hari libur dari API Nasional
// @route   POST /api/holidays/sync
exports.syncNationalHolidays = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    // Menggunakan Nager.Date API sebagai sumber yang lebih reliable (karena dayoffapi sering 402)
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/ID`);
    
    if (!response.ok) {
       return res.status(500).json({ success: false, message: 'Gagal mengambil data dari API libur nasional' });
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
       return res.status(500).json({ success: false, message: 'Format data API tidak sesuai' });
    }

    let addedCount = 0;
    for (const item of data) {
      // API Nager.Date menggunakan item.date dan item.localName
      if (!item.date || !item.localName) continue;

      const holidayDate = new Date(item.date);
      holidayDate.setHours(0, 0, 0, 0);

      const exist = await Holiday.findOne({ date: holidayDate });
      if (!exist) {
        await Holiday.create({ date: holidayDate, description: item.localName });
        addedCount++;
      }
    }

    res.status(200).json({ success: true, message: `Berhasil sinkronisasi. ${addedCount} hari libur nasional ditambahkan.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Hapus hari libur
// @route   DELETE /api/holidays/:id
exports.deleteHoliday = async (req, res, next) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Hari libur tidak ditemukan' });
    }
    await holiday.deleteOne();
    res.status(200).json({ success: true, message: 'Hari libur berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};