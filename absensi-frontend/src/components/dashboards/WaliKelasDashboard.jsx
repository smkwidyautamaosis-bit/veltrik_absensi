import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function WaliKelasDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const [attendances, setAttendances] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('monitor');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAtt = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/today`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendances(resAtt.data.data);

        const resPerm = await axios.get(`${import.meta.env.VITE_API_URL}/api/permissions/class`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPermissions(resPerm.data.data);

        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const todayStr = days[new Date().getDay()];
        const resSchedule = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules?teacher=${user?._id}&dayOfWeek=${todayStr}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMySchedules(resSchedule.data.data || []);
      } catch (err) {
        console.error('Error fetching class data', err);
      }
    };
    fetchData();

    const socket = io(`${import.meta.env.VITE_API_URL}`);
    socket.on('new-attendance', (newRecord) => {
      setAttendances((prev) => [newRecord, ...prev]);
    });
    return () => socket.disconnect();
  }, [token, user?._id]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Gagal update status', err);
      alert('Gagal memperbarui status');
    }
  };

  const handlePermissionStatus = async (id, newStatus) => {
    if (!window.confirm(`Yakin ingin men-${newStatus === 'approved' ? 'setujui' : 'tolak'} pengajuan ini?`)) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/permissions/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPermissions(permissions.map(p => p._id === id ? { ...p, status: newStatus } : p));
      alert(`Pengajuan berhasil di-${newStatus === 'approved' ? 'setujui' : 'tolak'}`);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status izin.');
    }
  };

  const pendingCount = permissions.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button 
          onClick={() => setActiveTab('monitor')} 
          className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all ${activeTab === 'monitor' ? 'bg-white text-maroon shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Monitor Kehadiran
        </button>
        <button 
          onClick={() => setActiveTab('izin')} 
          className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'izin' ? 'bg-white text-maroon shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Validasi Izin & Sakit
          {pendingCount > 0 && (
            <span className="bg-maroon text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'monitor' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-fade-in">
          <div className="px-5 py-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Monitor Kelas Anda</h2>
            <p className="text-sm text-gray-400 mt-0.5">Pantau secara realtime kehadiran siswa di kelas yang Anda bina hari ini.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waktu</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Koreksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {attendances.filter((record) => (record.userRole || 'siswa') === 'siswa').length > 0 ? (
                  attendances.filter((record) => (record.userRole || 'siswa') === 'siswa').map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-medium text-gray-500">{new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-5 py-3.5 font-semibold text-gray-900 text-sm">{record.student?.name}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge badge-${record.status === 'alfa' ? 'alpa' : record.status}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select 
                          value={record.status} 
                          onChange={(e) => handleUpdateStatus(record._id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition"
                        >
                          <option value="hadir">Hadir</option>
                          <option value="telat">Telat</option>
                          <option value="izin">Izin</option>
                          <option value="sakit">Sakit</option>
                          <option value="alfa">Alpa</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-12 text-center">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-sm text-gray-400 font-medium">Belum ada siswa yang melakukan scan hari ini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'izin' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Antrean Persetujuan Izin</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/80 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Siswa</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Tanggal</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Tipe</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Bukti</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {permissions.length > 0 ? (
                  permissions.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900 text-sm">{p.student?.name}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{p.student?.nisn}</p>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <span className="font-semibold">{p.startDate}</span> <br/> s/d <br/> <span className="font-semibold">{p.endDate}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge badge-${p.type}`}>{p.type}</span>
                        <p className="text-xs text-gray-400 mt-1 max-w-[150px] truncate">"{p.reason}"</p>
                      </td>
                      <td className="px-5 py-4">
                        <a 
                          href={p.attachmentUrl.startsWith('http') ? p.attachmentUrl : `${import.meta.env.VITE_API_URL}${p.attachmentUrl}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-bold text-maroon hover:text-maroon-dark hover:underline flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          Lihat
                        </a>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handlePermissionStatus(p._id, 'approved')} className="bg-status-hadir/10 text-status-hadir px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-status-hadir/20 transition">
                              ✓ Setujui
                            </button>
                            <button onClick={() => handlePermissionStatus(p._id, 'rejected')} className="bg-status-alpa/10 text-status-alpa px-3.5 py-2 rounded-lg text-xs font-bold hover:bg-status-alpa/20 transition">
                              ✕ Tolak
                            </button>
                          </div>
                        ) : (
                          <span className={`badge ${p.status === 'approved' ? 'badge-hadir' : 'badge-alpa'}`}>
                            {p.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center">
                      <div className="text-4xl mb-3">✅</div>
                      <p className="text-sm text-gray-400 font-medium">Tidak ada pengajuan izin saat ini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Jadwal Mengajar Saya Hari Ini</h2>
        </div>
        <div className="p-5">
          {mySchedules.length === 0 ? (
            <p className="text-sm text-gray-400">Tidak ada jadwal mengajar hari ini.</p>
          ) : (
            <div className="space-y-2">
              {mySchedules.map((sched) => (
                <div key={sched._id} className="border border-gray-100 rounded-lg px-4 py-3">
                  <p className="text-sm font-bold text-gray-900">{sched.subject}</p>
                  <p className="text-xs text-gray-500">
                    {sched.startTime} - {sched.endTime} | {sched.classId ? `${sched.classId.name} ${sched.classId.major}` : '-'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
