import { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';

export default function AdminDashboard() {
  const token = localStorage.getItem('token');
  const [qrToken, setQrToken] = useState('');
  const [attendances, setAttendances] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalClasses: 0 });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const qrRes = await axios.get('http://localhost:5000/api/qr/generate', { headers: { Authorization: `Bearer ${token}` } });
        setQrToken(qrRes.data.data.token);

        const attRes = await axios.get('http://localhost:5000/api/attendance/today', { headers: { Authorization: `Bearer ${token}` } });
        setAttendances(attRes.data.data);

        // Fetch basic stats (optional, using existing endpoints)
        const userRes = await axios.get('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } });
        const classRes = await axios.get('http://localhost:5000/api/classes', { headers: { Authorization: `Bearer ${token}` } });
        setStats({ totalUsers: userRes.data.count, totalClasses: classRes.data.count });
      } catch (err) {
        console.error('Error fetching admin data', err);
      }
    };

    fetchData();

    const socket = io('http://localhost:5000');
    socket.on('new-attendance', (newRecord) => {
      setAttendances((prev) => [newRecord, ...prev]);
    });

    return () => socket.disconnect();
  }, [token]);

  const handleGenerateAlpa = async () => {
    if (!window.confirm('Yakin ingin menutup absensi hari ini dan mengenerate Alpa untuk siswa yang belum absen?')) return;
    
    setIsGenerating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/attendance/generate-alpa', {}, {
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Total Pengguna</h3>
          <p className="text-3xl font-extrabold text-[#183057] mt-2">{stats.totalUsers}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Kelas Aktif</h3>
          <p className="text-3xl font-extrabold text-[#183057] mt-2">{stats.totalClasses}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-bold text-gray-500 uppercase">Status Server</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-xl font-bold text-green-700">Online</p>
          </div>
          <button 
            onClick={handleGenerateAlpa} 
            disabled={isGenerating}
            className="mt-4 w-full bg-red-50 text-red-700 border border-red-200 text-xs font-bold py-2 rounded-md hover:bg-red-100 transition disabled:opacity-50"
          >
            {isGenerating ? 'Memproses...' : 'Tutup Absensi (Generate Alpa)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-lg lg:col-span-1 flex flex-col items-center justify-center print-area">
          <h2 className="text-base font-bold text-gray-900 mb-1">QR Gerbang Utama</h2>
          <p className="text-xs text-gray-500 mb-6 text-center hide-on-print">Gunakan menu sidebar untuk mencetak QR.</p>
          <div className="p-4 border border-gray-100 rounded-md bg-white">
            {qrToken ? (
              <QRCodeSVG value={qrToken} size={160} bgColor={"#ffffff"} fgColor={"#111827"} level={"H"} />
            ) : (
              <span className="text-gray-400 text-sm">Memuat...</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden lg:col-span-2 hide-on-print flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-900">Live Monitor Kehadiran</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-semibold text-gray-500">Realtime Active</span>
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendances.length > 0 ? (
                  attendances.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-3 text-xs">{new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-6 py-3 font-medium text-gray-900 text-sm">{record.student?.name}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${record.status === 'hadir' ? 'bg-green-50 text-green-700' : record.status === 'telat' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-gray-500">Belum ada data hari ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
