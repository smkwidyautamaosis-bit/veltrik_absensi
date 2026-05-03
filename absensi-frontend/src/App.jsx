import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Semua Halaman (Pages)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import StudentManagement from './pages/StudentManagement';
import TeacherManagement from './pages/TeacherManagement';
import ClassManagement from './pages/ClassManagement'; // Tambahan untuk Data Kelas
import Settings from './pages/Settings'; // Tambahan untuk Pengaturan GPS Radius
import Calendar from './pages/Calendar'; // Tambahan untuk Kalender Sekolah
import Report from './pages/Report'; // Tambahan untuk Laporan PDF & Excel
import ScheduleManagement from './pages/ScheduleManagement'; // Tambahan untuk Jadwal
import ParentManagement from './pages/ParentManagement'; // Tambahan untuk Orang Tua
import AcademicYearManagement from './pages/AcademicYearManagement';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />; 
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Publik */}
        <Route path="/" element={<Login />} />
        
        {/* Rute Terlindungi (Wajib Login) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/scanner" 
          element={
            <ProtectedRoute>
              <Scanner />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/students" 
          element={
            <ProtectedRoute>
              <StudentManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/teachers" 
          element={
            <ProtectedRoute>
              <TeacherManagement />
            </ProtectedRoute>
          } 
        />

        {/* Rute Baru: Manajemen Kelas */}
        <Route 
          path="/classes" 
          element={
            <ProtectedRoute>
              <ClassManagement />
            </ProtectedRoute>
          } 
        />

        {/* Rute Baru: Pengaturan */}
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />

        {/* Rute Baru: Kalender */}
        <Route 
          path="/holidays" 
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } 
        />

        {/* Rute Baru: Laporan */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/schedules" 
          element={
            <ProtectedRoute>
              <ScheduleManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/parents" 
          element={
            <ProtectedRoute>
              <ParentManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/academic-years" 
          element={
            <ProtectedRoute>
              <AcademicYearManagement />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;