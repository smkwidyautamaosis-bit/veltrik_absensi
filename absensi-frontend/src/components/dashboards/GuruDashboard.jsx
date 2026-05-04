import { useState, useEffect } from 'react';
import axios from 'axios';

export default function GuruDashboard() {
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mendapatkan nama hari ini dalam bahasa Indonesia
  const getTodayString = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const d = new Date();
    return days[d.getDay()];
  };

  const todayStr = getTodayString();

  useEffect(() => {
    fetchMySchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMySchedules = async () => {
    setLoading(true);
    try {
      // Hanya ambil jadwal untuk guru ini dan pada hari ini
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules?teacher=${user._id}&dayOfWeek=${todayStr}`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSchedules(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil jadwal', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white border border-gray-200 p-6 md:p-8 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-maroon">Selamat Datang, Bapak/Ibu {user?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Anda masuk sebagai Guru Mata Pelajaran. Berikut adalah jadwal Anda untuk hari ini.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-5 py-3 rounded-md text-center shrink-0">
          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Hari Ini</p>
          <p className="text-lg font-extrabold text-blue-900">{todayStr}</p>
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
