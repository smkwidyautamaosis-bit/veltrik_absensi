const multer = require('multer');

// Gunakan memoryStorage karena file akan diteruskan ke Supabase
const storage = multer.memoryStorage();

// Filter tipe file (jpg, jpeg, png, pdf)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(file.originalname.split('.').pop().toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Hanya diperbolehkan format JPG, JPEG, PNG, atau PDF!'), false);
  }
};

// Inisialisasi multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Maksimal 2MB
  fileFilter: fileFilter
});

module.exports = upload;
