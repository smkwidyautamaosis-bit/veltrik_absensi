import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import TUDashboard from '../components/dashboards/TUDashboard';
import SiswaDashboard from '../components/dashboards/SiswaDashboard';
import KepalaSekolahDashboard from '../components/dashboards/KepalaSekolahDashboard';
import WaliKelasDashboard from '../components/dashboards/WaliKelasDashboard';
import GuruDashboard from '../components/dashboards/GuruDashboard';
import OrangTuaDashboard from '../components/dashboards/OrangTuaDashboard';
import NotificationBell from '../components/NotificationBell';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handlePrintQR = () => {
    window.print();
  };

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'tata_usaha':
        return <TUDashboard />;
      case 'siswa':
        return <SiswaDashboard />;
      case 'kepala_sekolah':
        return <KepalaSekolahDashboard />;
      case 'wali_kelas':
        return <WaliKelasDashboard />;
      case 'guru':
        return <GuruDashboard />;
      case 'orang_tua':
        return <OrangTuaDashboard />;
      default:
        return <div className="text-center p-10 text-gray-500">Role tidak dikenali</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* HEADER MOBILE (Hanya tampil di HP) */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={handleLogout}
            className="text-xs font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* SIDEBAR (Hanya tampil di Layar Besar / PC) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col hide-on-print z-10 shrink-0">
        <div className="px-6 py-8 border-b border-gray-100 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Absensi Digital</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu Utama</div>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-100 rounded-md transition">
            Dashboard
          </button>

          {(user?.role === 'admin' || user?.role === 'tata_usaha') && (
            <>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Manajemen Data</div>
              <button onClick={() => navigate('/students')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Data Siswa</button>
              <button onClick={() => navigate('/teachers')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Data Guru</button>
              <button onClick={() => navigate('/classes')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Data Kelas</button>
              <button onClick={() => navigate('/academic-years')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Tahun Ajaran</button>
              <button onClick={() => navigate('/parents')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Data Orang Tua</button>
              <button onClick={handlePrintQR} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Cetak QR Gerbang</button>

              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Laporan</div>
              <button onClick={() => navigate('/reports')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Export & Laporan</button>

              {user?.role === 'admin' && (
                <>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Sistem</div>
                  <button onClick={() => navigate('/settings')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Pengaturan Sekolah</button>
                </>
              )}
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Akademik</div>
              <button onClick={() => navigate('/schedules')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Jadwal Pelajaran</button>
              <button onClick={() => navigate('/holidays')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Kalender Sekolah</button>
            </>
          )}

          {user?.role === 'kepala_sekolah' && (
            <>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Laporan & Statistik</div>
              <button onClick={() => navigate('/reports')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Laporan Kehadiran</button>
            </>
          )}

          {user?.role === 'wali_kelas' && (
            <>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Kelas Saya</div>
              <button onClick={() => navigate('/reports')} className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition">Rekap Kelas</button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="px-3 py-3 mb-4 rounded-md">
            <p className="text-xs text-gray-500 mb-1">Masuk sebagai</p>
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full text-center px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
        <div className="max-w-6xl mx-auto pb-10">
          
          <div className="mb-8 md:mb-10 hide-on-print flex justify-between items-end">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 capitalize">Beranda {user?.role?.replace('_', ' ')}</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Sistem Informasi Kehadiran Terpadu SMK Widya Utama</p>
            </div>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>
          
          {/* DYNAMIC DASHBOARD COMPONENT INJECTION */}
          {renderDashboardContent()}

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white; }
          .hide-on-print { display: none !important; }
          .print-area { border: none !important; width: 100% !important; margin: 0 auto; display: block !important; }
        }
      `}} />
    </div>
  );
}