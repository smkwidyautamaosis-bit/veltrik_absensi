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
import AppSidebar from '../components/AppSidebar';

// Helper: Greeting berdasarkan jam
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'Selamat Pagi';
  if (h >= 11 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

// Helper: Format tanggal
function getDateString() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Helper: Role label
function getRoleLabel(role) {
  const map = {
    admin: 'Administrator',
    tata_usaha: 'Tata Usaha',
    siswa: 'Siswa',
    kepala_sekolah: 'Kepala Sekolah',
    wali_kelas: 'Wali Kelas',
    guru: 'Guru',
    orang_tua: 'Orang Tua',
  };
  return map[role] || role;
}

// SVG Icons
const icons = {
  dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  students: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
  teachers: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>,
  classes: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" /></svg>,
  year: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
  parents: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197" /></svg>,
  qr: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zm0 9.75c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zm9.75-9.75c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg>,
  report: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v10.5c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 019 19.875V9.375zm6-3.75c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0115 19.875V5.625z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  schedule: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
  rekap: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handlePrintQR = () => window.print();

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'admin': return <AdminDashboard />;
      case 'tata_usaha': return <TUDashboard />;
      case 'siswa': return <SiswaDashboard />;
      case 'kepala_sekolah': return <KepalaSekolahDashboard />;
      case 'wali_kelas': return <WaliKelasDashboard />;
      case 'guru': return <GuruDashboard />;
      case 'orang_tua': return <OrangTuaDashboard />;
      default: return <div className="text-center p-10 text-gray-500">Role tidak dikenali</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen font-poppins text-gray-900 overflow-hidden" style={{ background: '#F8F9FA' }}>
      
      {/* ===== HEADER MOBILE ===== */}
      <header className="md:hidden bg-maroon-dark px-5 py-3.5 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">VELTRIK</h1>
            <p className="text-[9px] text-white/50 uppercase tracking-wider font-medium">{getRoleLabel(user?.role)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={handleLogout} className="p-2 text-white/60 hover:text-white transition">
            {icons.logout}
          </button>
        </div>
      </header>

      <AppSidebar user={user} onLogout={handleLogout} onPrintQR={handlePrintQR} />

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-y-auto relative" style={{ background: '#F8F9FA' }}>
        <div className="max-w-6xl mx-auto px-5 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
          
          {/* Header Greeting */}
          <div className="mb-6 md:mb-8 hide-on-print flex justify-between items-start">
            <div className="animate-fade-in">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
              </h2>
              <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium">{getDateString()}</p>
            </div>
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          </div>
          
          {/* Dynamic Dashboard */}
          <div className="page-enter">
            {renderDashboardContent()}
          </div>

        </div>
      </main>

      {/* ===== BOTTOM NAV MOBILE ===== */}
      {user?.role && (
        <nav className="bottom-nav md:hidden hide-on-print">
          <button className="bottom-nav-item active">
            {icons.dashboard}
            <span>Beranda</span>
          </button>
          {user?.role === 'siswa' && (
            <button className="bottom-nav-item" onClick={() => navigate('/scanner')}>
              {icons.qr}
              <span>Scan QR</span>
            </button>
          )}
          {(user?.role === 'admin' || user?.role === 'tata_usaha') && (
            <>
              <button className="bottom-nav-item" onClick={() => navigate('/students')}>
                {icons.students}
                <span>Siswa</span>
              </button>
              <button className="bottom-nav-item" onClick={() => navigate('/reports')}>
                {icons.report}
                <span>Laporan</span>
              </button>
            </>
          )}
          {user?.role === 'wali_kelas' && (
            <button className="bottom-nav-item" onClick={() => navigate('/reports')}>
              {icons.rekap}
              <span>Rekap</span>
            </button>
          )}
          <button className="bottom-nav-item" onClick={handleLogout}>
            {icons.logout}
            <span>Keluar</span>
          </button>
        </nav>
      )}

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