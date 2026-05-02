const cron = require('node-cron');
const { generateAlpa } = require('../controllers/attendanceController');

// Jadwalkan job untuk berjalan setiap hari pada jam 15:00 WIB
// Di server dengan timezone UTC, 15:00 WIB adalah jam 08:00 UTC.
// Agar aman dari masalah timezone, pastikan server timezone diset ke Asia/Jakarta
// Atau jalankan string cron berikut:
const initCronJobs = () => {
  cron.schedule('0 15 * * *', async () => {
    console.log('Menjalankan Auto-Alpa otomatis pada 15:00 WIB...');
    try {
      // Kita panggil fungsi controller secara langsung tanpa req/res objects
      // Karena kita mendesain ulang generateAlpa, req/res bisa diabaikan atau disimulasikan
      const req = {};
      const res = {
        status: (code) => ({
          json: (data) => console.log(`Auto-Alpa Selesai [${code}]:`, data.message)
        })
      };
      
      await generateAlpa(req, res);
    } catch (error) {
      console.error('Gagal menjalankan Auto-Alpa via Cron:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });

  console.log('Cron Job Terjadwal: Auto-Alpa (15:00 WIB)');
};

module.exports = initCronJobs;
