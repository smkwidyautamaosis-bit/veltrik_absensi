import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  const [qrToken, setQrToken] = useState('');
  const [attendances, setAttendances] = useState([]); 
  const [studentHistory, setStudentHistory] = useState([]); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const fetchStaticQR = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/qr/generate', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrToken(response.data.data.token);
    } catch (error) {
      console.error('Gagal mengambil token QR:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendances(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil data absensi admin:', error);
    }
  };

  const fetchStudentHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attendance/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentHistory(response.data.data);
    } catch (error) {
      console.error('Gagal mengambil riwayat siswa:', error);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'tata_usaha') {
      fetchStaticQR();
      fetchTodayAttendance();

      const socket = io('http://localhost:5000');
      socket.on('new-attendance', (newRecord) => {
        setAttendances((prev) => [newRecord, ...prev]);
      });

      return () => socket.disconnect();
    } else if (user?.role === 'siswa') {
      fetchStudentHistory();
    }
  }, [user?.role, token]);

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* HEADER MOBILE (Hanya tampil di HP) */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Veltrik.</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{user?.role}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
        >
          Keluar
        </button>
      </header>

      {/* SIDEBAR MINIMALIS (Hanya tampil di Layar Besar / PC) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col hide-on-print z-10 shrink-0">
        <div className="px-6 py-8 border-b border-gray-100">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Veltrik.</h1>
          <p className="text-xs text-gray-500 mt-1">Sistem Absensi Digital</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu Utama</div>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-100 rounded-md transition">
            Dashboard
          </button>

          {(user?.role === 'admin' || user?.role === 'tata_usaha') && (
            <>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Manajemen Data</div>
              <button 
                onClick={() => navigate('/students')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
              >
                Data Siswa
              </button>
              
              {/* TOMBOL BARU UNTUK DATA GURU */}
              <button 
                onClick={() => navigate('/teachers')}
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
              >
                Data Guru
              </button>

              <button 
                onClick={handlePrintQR}
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
              >
                Cetak QR Gerbang
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="px-3 py-3 mb-4 rounded-md">
            <p className="text-xs text-gray-500 mb-1">Masuk sebagai</p>
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{user?.role}</p>
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
        <div className="max-w-5xl mx-auto pb-10">
          
          <div className="mb-8 md:mb-10 hide-on-print flex justify-between items-end">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Ringkasan Hari Ini</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Pantau data absensi secara waktu nyata.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 md:mb-10">
            
            {/* Panel QR Khusus Admin/TU */}
            {(user?.role === 'admin' || user?.role === 'tata_usaha') && (
              <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-lg flex flex-col items-start justify-center print-area">
                <h2 className="text-base font-bold text-gray-900 mb-1">QR Gerbang Utama</h2>
                <p className="text-sm text-gray-500 mb-6 hide-on-print">Gunakan sidebar navigasi untuk mencetak.</p>
                <div className="p-4 border border-gray-100 rounded-md bg-white self-center md:self-start">
                  {qrToken ? (
                    <QRCodeSVG value={qrToken} size={140} bgColor={"#ffffff"} fgColor={"#111827"} level={"H"} />
                  ) : (
                    <span className="text-gray-400 text-sm">Memuat...</span>
                  )}
                </div>
              </div>
            )}

            {/* Panel Scan Khusus Siswa */}
            {user?.role === 'siswa' && (
              <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-lg flex flex-col items-start justify-center">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Waktunya Absen</h2>
                <p className="text-xs md:text-sm text-gray-500 mb-6 max-w-sm">Pastikan Anda sudah berada di dalam radius area sekolah sebelum memindai QR Code.</p>
                <button 
                  onClick={() => navigate('/scanner')}
                  className="w-full md:w-auto bg-gray-900 text-white px-6 py-3 md:py-2.5 rounded-md text-sm font-medium hover:bg-black transition-colors"
                >
                  Buka Kamera Scanner
                </button>
              </div>
            )}
          </div>

          {/* Tabel Absensi Admin/TU */}
          {(user?.role === 'admin' || user?.role === 'tata_usaha') && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hide-on-print">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 flex justify-between items-center bg-white">
                <h2 className="text-xs md:text-sm font-bold text-gray-900">Live Monitor Kehadiran</h2>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] md:text-xs font-semibold text-gray-500">Realtime Active</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                      <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendances.length > 0 ? (
                      attendances.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900 text-xs md:text-sm">
                            {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 font-medium text-gray-900 text-xs md:text-sm">{record.student?.name}</td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 md:px-2.5 rounded-md text-[10px] md:text-xs font-semibold ${record.status === 'hadir' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="px-6 py-10 text-center text-xs md:text-sm text-gray-500">Belum ada data absensi hari ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tabel Absensi Siswa */}
          {user?.role === 'siswa' && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-white">
                <h2 className="text-xs md:text-sm font-bold text-gray-900">Riwayat Kehadiran Anda</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu Scan</th>
                      <th className="px-4 md:px-6 py-3 text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {studentHistory.length > 0 ? (
                      studentHistory.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900 text-xs md:text-sm">{record.date}</td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap text-gray-900 text-xs md:text-sm">
                            {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 md:px-2.5 rounded-md text-[10px] md:text-xs font-semibold ${record.status === 'hadir' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="px-6 py-10 text-center text-xs md:text-sm text-gray-500">Anda belum memiliki riwayat absensi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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