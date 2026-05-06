const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Guru wajib dipilih'],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Kelas wajib dipilih'],
    },
    subject: {
      type: String,
      required: [true, 'Mata Pelajaran wajib diisi'],
      trim: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
      required: [true, 'Hari wajib diisi'],
    },
    startTime: {
      type: String,
      required: [true, 'Jam Mulai wajib diisi (misal 07:30)'],
    },
    endTime: {
      type: String,
      required: [true, 'Jam Selesai wajib diisi (misal 09:00)'],
    },
    meetingType: {
      type: String,
      enum: ['teori', 'praktik', 'pramuka'],
      default: 'teori',
    },
  },
  { timestamps: true }
);

// Mencegah jadwal bentrok (guru yang sama tidak bisa mengajar di kelas berbeda pada jam dan hari yang sama)
// Karena validasi jam tumpang tindih cukup kompleks, ini sekedar index dasar
scheduleSchema.index({ teacher: 1, dayOfWeek: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Schedule', scheduleSchema);
