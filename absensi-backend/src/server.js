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
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const qrRoutes = require('./routes/qrRoutes');
const teacherRoutes = require('./routes/teacherRoutes'); // <-- TAMBAHAN: Import rute guru

// Inisialisasi Express
const app = express();
const server = http.createServer(app);

// Inisialisasi Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware Global
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(helmet());
app.use(morgan('dev'));

// Koneksi ke Database
connectDB();

// Jadikan instance io bisa diakses global
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Client terhubung ke dashboard realtime: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Client terputus: ${socket.id}`);
  });
});

// Mendaftarkan Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/teachers', teacherRoutes); // <-- TAMBAHAN: Daftarkan endpoint API guru

app.get('/', (req, res) => {
  res.send('API Sistem Absensi Veltrik Berjalan Lancar');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});