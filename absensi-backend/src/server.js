require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

// Import Konfigurasi & Middleware
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorMiddleware');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const qrRoutes = require('./routes/qrRoutes');
const permissionRoutes = require('./routes/permissionRoutes');
const configRoutes = require('./routes/configRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const parentRoutes = require('./routes/parentRoutes');
const studentRoutes = require('./routes/studentRoutes');
const academicYearRoutes = require('./routes/academicYearRoutes');
const initCronJobs = require('./utils/cron');
const notificationService = require('./utils/notificationService');

// Inisialisasi Express
const app = express();
const server = http.createServer(app);

// Inisialisasi Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware Global
app.use(express.json());
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true 
}));
app.use(helmet({ crossOriginResourcePolicy: false })); // Agar gambar uploads bisa diload frontend
app.use(morgan('dev'));

// Serve static folder untuk foto surat izin
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Koneksi ke Database
connectDB();

// Inisialisasi Cron Jobs (Auto-Alpa)
initCronJobs();

// Jadikan instance io bisa diakses global
app.set('io', io);
notificationService.setSocketIo(io);

io.on('connection', (socket) => {
  console.log(`Client terhubung ke dashboard realtime: ${socket.id}`);
  
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client terputus: ${socket.id}`);
  });
});

// Mendaftarkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/config', configRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/academic-years', academicYearRoutes);

app.get('/', (req, res) => {
  res.send('API Sistem Absensi Veltrik Berjalan Lancar');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});