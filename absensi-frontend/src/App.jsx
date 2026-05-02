import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import Semua Halaman (Pages)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import StudentManagement from './pages/StudentManagement';
import TeacherManagement from './pages/TeacherManagement'; // Import halaman guru

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

        {/* Rute Data Guru Baru */}
        <Route 
          path="/teachers" 
          element={
            <ProtectedRoute>
              <TeacherManagement />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;