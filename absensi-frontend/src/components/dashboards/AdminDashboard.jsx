import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

export default function AdminDashboard() {
  const token = localStorage.getItem('token');
  const [qrToken, setQrToken] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalClasses: 0 });
  const [todayStats, setTodayStats] = useState({ hadir: 0, telat: 0, alpa: 0, izinSakit: 0, guruTotal: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qrRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/qr/generate`, { headers: { Authorization: `Bearer ${token}` } });
        setQrToken(qrRes.data.data.token);

        const attRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/today`, { headers: { Authorization: `Bearer ${token}` } });
        const data = attRes.data.data;
        setAttendances(data);

        // Hitung statistik hari ini
        const studentRecords = data.filter(a => (a.userRole || 'siswa') === 'siswa');
        const teacherRecords = data.filter(a => ['guru', 'wali_kelas'].includes(a.userRole));
        const hadir = studentRecords.filter(a => a.status === 'hadir').length;
        const telat = studentRecords.filter(a => a.status === 'telat').length;
        const alpa = studentRecords.filter(a => a.status === 'alfa').length;
        const izinSakit = studentRecords.filter(a => a.status === 'izin' || a.status === 'sakit').length;
        setTodayStats({ hadir, telat, alpa, izinSakit, guruTotal: teacherRecords.length });

        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
        const classRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, { headers: { Authorization: `Bearer ${token}` } });
        setStats({ totalUsers: userRes.data.count, totalClasses: classRes.data.count });
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    const socket = io(`${import.meta.env.VITE_API_URL}`);
    socket.on('new-attendance', (newRecord) => {
      setAttendances((prev) => [newRecord, ...prev]);
      // Live update stats
      const role = newRecord.userRole || 'siswa';
      if (role === 'siswa') {
        if (newRecord.status === 'hadir') setTodayStats(s => ({ ...s, hadir: s.hadir + 1 }));
        else if (newRecord.status === 'telat') setTodayStats(s => ({ ...s, telat: s.telat + 1 }));
      } else if (role === 'guru' || role === 'wali_kelas') {
        setTodayStats((s) => ({ ...s, guruTotal: s.guruTotal + 1 }));
      }
    });

    return () => socket.disconnect();
  }, [token]);

  const handleGenerateAlpa = async () => {
    if (!window.confirm('Yakin ingin menutup absensi hari ini dan mengenerate Alpa untuk siswa yang belum absen?')) return;
    
    setIsGenerating(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/generate-alpa`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message);
    } catch (err) {
      console.error(err);
      alert('Gagal mengenerate Alpa otomatis.');
    } finally {
      setIsGenerating(false);
    }
  };

  const statCards = [
    { label: 'Hadir', value: todayStats.hadir, color: '#27AE60', bgColor: '#EAFAF1', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Telat', value: todayStats.telat, color: '#F39C12', bgColor: '#FEF9E7', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Alpa', value: todayStats.alpa, color: '#E74C3C', bgColor: '#FDEDEC', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Izin/Sakit', value: todayStats.izinSakit, color: '#2980B9', bgColor: '#EBF5FB', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
  ];

  const getStatusBadge = (status) => {
    const map = {
      hadir: 'badge-hadir',
      telat: 'badge-telat',
      alfa: 'badge-alpa',
      izin: 'badge-izin',
      sakit: 'badge-sakit',
    };
    return `badge ${map[status] || 'badge-alpa'}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton skeleton-card"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton" style={{height: '280px', borderRadius: '12px'}}></div>
          <div className="lg:col-span-2 skeleton" style={{height: '280px', borderRadius: '12px'}}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card bg-white rounded-xl p-5 border border-gray-100 animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.bgColor, color: card.color }}>
                {card.icon}
              </div>
              <span className="text-3xl font-black animate-counter-up" style={{ color: card.color, animationDelay: `${i * 0.1 + 0.2}s` }}>
                {card.value}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label} Hari Ini</p>
          </div>
        ))}
        <div className="stat-card bg-white rounded-xl p-5 border border-gray-100 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-maroon/10 text-maroon">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5m10 0H7" /></svg>
            </div>
            <span className="text-3xl font-black text-maroon">{todayStats.guruTotal}</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Absensi Guru Hari Ini</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-maroon/10 flex items-center justify-center text-maroon">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{stats.totalUsers}</p>
            <p className="text-xs font-medium text-gray-400">Total Pengguna</p>
          </div>
        </div>
        <div className="stat-card bg-white rounded-xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold-dark">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" /></svg>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{stats.totalClasses}</p>
            <p className="text-xs font-medium text-gray-400">Kelas Aktif</p>
          </div>
        </div>
        <div className="stat-card bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-status-hadir animate-pulse"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-green-700">Server Online</p>
              <p className="text-xs font-medium text-gray-400">Sistem Berjalan</p>
            </div>
          </div>
          <button 
            onClick={handleGenerateAlpa} 
            disabled={isGenerating}
            className="text-[10px] font-bold px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition disabled:opacity-50"
          >
            {isGenerating ? '...' : 'Tutup Absensi'}
          </button>
        </div>
      </div>

      {/* QR + Live Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center justify-center print-area">
          <h2 className="text-sm font-bold text-gray-900 mb-1">QR Gerbang Utama</h2>
          <p className="text-xs text-gray-400 mb-5 text-center hide-on-print">Cetak QR ini dan pasang di gerbang sekolah.</p>
          <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl bg-white">
            {qrToken ? (
              <QRCodeSVG value={qrToken} size={160} bgColor={"#ffffff"} fgColor={"#800000"} level={"H"} />
            ) : (
              <div className="skeleton" style={{ width: 160, height: 160 }}></div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden lg:col-span-2 hide-on-print flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900">Live Monitor Kehadiran</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-hadir animate-pulse"></div>
              <span className="text-[10px] font-semibold text-gray-400">Realtime</span>
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-100 sticky top-0">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waktu</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendances.length > 0 ? (
                  attendances.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs font-medium text-gray-500">{new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{record.student?.name || record.user?.name}</td>
                      <td className="px-5 py-3">
                        <span className={getStatusBadge(record.status)}>{record.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="px-5 py-12 text-center text-sm text-gray-400">Belum ada data kehadiran hari ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
