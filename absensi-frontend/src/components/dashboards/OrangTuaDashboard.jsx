import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function OrangTuaDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildrenData();
    setupSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChildrenData = async () => {
    setLoading(true);
    try {
      // 1. Dapatkan daftar anak
      const resChildren = await axios.get(`${import.meta.env.VITE_API_URL}/api/parents/${user._id}/children`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      const children = resChildren.data.data;

      // 2. Dapatkan absensi hari ini untuk masing-masing anak
      const today = new Date().toISOString().split('T')[0];
      
      const childrenWithAttendance = await Promise.all(children.map(async (child) => {
        try {
          const resAtt = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/report?studentId=${child._id}&startDate=${today}&endDate=${today}`, {
            headers: { Authorization: `Bearer ${token}`}
          });
          const attendance = resAtt.data.data.length > 0 ? resAtt.data.data[0] : null;
          return { ...child, attendanceToday: attendance };
        } catch (err) {
          console.error('Error fetching child attendance:', err);
          return { ...child, attendanceToday: null };
        }
      }));

      setChildrenData(childrenWithAttendance);
    } catch (err) {
      console.error('Gagal mengambil data anak', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = io(`${import.meta.env.VITE_API_URL}`);
    // Listen to real-time attendance update
    socket.on('new-attendance', (attendance) => {
      setChildrenData(prev => prev.map(child => {
        if (child._id === attendance.student._id || child._id === attendance.student) {
          return { ...child, attendanceToday: attendance };
        }
        return child;
      }));
    });

    socket.on('update-attendance', (attendance) => {
      setChildrenData(prev => prev.map(child => {
        if (child._id === attendance.student._id || child._id === attendance.student) {
          return { ...child, attendanceToday: attendance };
        }
        return child;
      }));
    });

    return () => socket.disconnect();
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Belum Absen</span>;
    switch (status) {
      case 'hadir': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Hadir</span>;
      case 'telat': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Terlambat</span>;
      case 'izin': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Izin</span>;
      case 'sakit': return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">Sakit</span>;
      case 'alfa': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Alpa (Tanpa Keterangan)</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-maroon">Portal Orang Tua / Wali Murid</h2>
          <p className="text-sm text-gray-500 mt-1">Pantau kehadiran dan status anak Anda secara real-time dari sini.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Pemantauan Anak ({childrenData.length})</h3>
        <button onClick={fetchChildrenData} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
        </div>
      ) : childrenData.length === 0 ? (
        <div className="bg-white p-10 border border-gray-200 rounded-lg text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Belum Ada Anak Tertaut</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Akun Anda belum dihubungkan dengan data siswa manapun. Silakan hubungi Tata Usaha atau Wali Kelas untuk melakukan penautan akun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {childrenData.map(child => (
            <div key={child._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="p-5 border-b border-gray-100 flex items-start gap-4">
                <div className="w-14 h-14 bg-maroon/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-maroon font-bold text-xl">{child.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-bold text-gray-900 truncate">{child.name}</h4>
                  <p className="text-sm text-gray-500">NISN: {child.nisn || '-'}</p>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Kelas</p>
                    <p className="text-sm font-bold text-gray-800">{child.classId ? `${child.classId.name} ${child.classId.major}`: '-'}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Wali Kelas</p>
                    <p className="text-sm font-bold text-gray-800 truncate" title={child.waliKelasName}>{child.waliKelasName}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Status Hari Ini</p>
                    {getStatusBadge(child.attendanceToday?.status)}
                  </div>
                  {child.attendanceToday?.checkIn && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Waktu</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Date(child.attendanceToday.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
