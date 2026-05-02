import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

export default function WaliKelasDashboard() {
  const token = localStorage.getItem('token');
  const [attendances, setAttendances] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'izin'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resAtt = await axios.get('http://localhost:5000/api/attendance/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendances(resAtt.data.data);

        const resPerm = await axios.get('http://localhost:5000/api/permissions/class', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPermissions(resPerm.data.data);
      } catch (err) {
        console.error('Error fetching class data', err);
      }
    };
    fetchData();

    const socket = io('http://localhost:5000');
    socket.on('new-attendance', (newRecord) => {
      setAttendances((prev) => [newRecord, ...prev]);
    });
    return () => socket.disconnect();
  }, [token]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/attendance/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Gagal update status', err);
      alert('Gagal memperbarui status');
    }
  };

  const handlePermissionStatus = async (id, newStatus) => {
    if (!window.confirm(`Yakin ingin men-${newStatus} pengajuan ini?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/permissions/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Update state locally
      setPermissions(permissions.map(p => p._id === id ? { ...p, status: newStatus } : p));
      alert(`Pengajuan berhasil di-${newStatus}`);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status izin.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('monitor')} 
          className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'monitor' ? 'border-[#183057] text-[#183057]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Monitor Kehadiran Harian
        </button>
        <button 
          onClick={() => setActiveTab('izin')} 
          className={`text-sm font-bold pb-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'izin' ? 'border-[#183057] text-[#183057]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Validasi Izin & Sakit
          {permissions.filter(p => p.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {permissions.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'monitor' && (
        <div className="bg-white border border-gray-200 p-8 rounded-lg">
          <h2 className="text-xl font-bold text-[#183057] mb-2">Monitor Kelas Anda</h2>
          <p className="text-sm text-gray-500 mb-6">Pantau secara realtime kehadiran siswa di kelas yang Anda bina hari ini.</p>
          
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Koreksi Manual</th>
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
                      <td className="px-6 py-3 text-right">
                        <select 
                          value={record.status} 
                          onChange={(e) => handleUpdateStatus(record._id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer focus:outline-none"
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
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">Belum ada siswa di kelas Anda yang melakukan scan hari ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'izin' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Antrean Persetujuan Izin</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Siswa</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Bukti Surat</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {permissions.length > 0 ? (
                  permissions.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{p.student?.name}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{p.student?.nisn}</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-semibold">{p.startDate}</span> <br/> s/d <br/> <span className="font-semibold">{p.endDate}</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-bold uppercase text-gray-700">{p.type}</span><br/>
                        <span className="text-gray-400">"{p.reason}"</span>
                      </td>
                      <td className="px-6 py-4">
                        <a href={`http://localhost:5000${p.attachmentUrl}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#183057] hover:underline flex items-center gap-1">
                          Lihat File
                        </a>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handlePermissionStatus(p._id, 'approved')} className="bg-green-100 text-green-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-green-200 transition">Setujui</button>
                            <button onClick={() => handlePermissionStatus(p._id, 'rejected')} className="bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-200 transition">Tolak</button>
                          </div>
                        ) : (
                          <span className={`px-2 py-1.5 rounded text-xs font-bold uppercase tracking-wider ${p.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {p.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">Tidak ada pengajuan izin saat ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
