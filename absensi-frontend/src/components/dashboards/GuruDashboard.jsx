import { useState, useEffect } from 'react';
import axios from 'axios';

export default function GuruDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');
  const [schedules, setSchedules] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mendapatkan nama hari ini dalam bahasa Indonesia
  const getTodayString = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date();
    return days[d.getDay()];
  };

  const todayStr = getTodayString();

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, historyRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/schedules?teacher=${user._id}&dayOfWeek=${todayStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSchedules(scheduleRes.data.data || []);

      const histories = historyRes.data.data || [];
      setAttendanceHistory(histories);
      const today = new Date().toISOString().split('T')[0];
      setTodayAttendance(histories.find((item) => item.date === today) || null);
    } catch (err) {
      console.error('Gagal mengambil data dashboard guru', err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">

      <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-maroon">Selamat Datang, Bapak/Ibu {user?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Pantau absensi pribadi dan jadwal mengajar Anda dari dashboard ini.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-5 py-3 rounded-md text-center shrink-0">
          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Hari Ini</p>
          <p className="text-lg font-extrabold text-blue-900">{todayStr}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Absensi Saya Hari Ini</p>
          {todayAttendance ? (
            <div className="space-y-2">
              <span className={getStatusBadge(todayAttendance.status)}>{todayAttendance.status}</span>
              <p className="text-xs text-gray-500">
                Scan: {new Date(todayAttendance.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Belum ada absensi hari ini.</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipe Guru</p>
          <p className="text-sm font-semibold text-gray-900 capitalize">
            {(user?.teacherType || 'produktif').replace('_', ' ')}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Total Riwayat Absensi</p>
          <p className="text-2xl font-black text-maroon">{attendanceHistory.length}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900">Riwayat Absensi Saya</h3>
        </div>
        <div className="p-5">
          {attendanceHistory.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada riwayat absensi.</p>
          ) : (
            <div className="space-y-2">
              {attendanceHistory.slice(0, 7).map((item) => (
                <div key={item._id} className="flex items-center justify-between border border-gray-100 rounded-md px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.date}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={getStatusBadge(item.status)}>{item.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900">Jadwal Mengajar Anda Hari Ini</h3>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-md border border-dashed border-gray-300">
              <p className="text-sm text-gray-500">Anda tidak memiliki jadwal mengajar pada hari ini ({todayStr}).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((sched) => (
                <div key={sched._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition bg-white flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                        {sched.startTime} - {sched.endTime}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{sched.subject}</h4>
                    <p className="text-sm text-gray-600 mb-4 font-medium">
                      Kelas: {sched.classId ? `${sched.classId.name} ${sched.classId.major}`: <span className="text-red-500">Deleted</span>}
                    </p>
                  </div>
                  
                  <button 
                    disabled
                    className="w-full mt-auto bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 font-bold text-xs px-4 py-2.5 rounded-md transition"
                    title="Fitur absensi per mapel belum aktif."
                  >
                    Segera Hadir: Absen Kelas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
