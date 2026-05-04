import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SiswaDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [studentHistory, setStudentHistory] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState('absensi');
  const [todayStatus, setTodayStatus] = useState(null);

  // State form izin
  const [formData, setFormData] = useState({ startDate: '', endDate: '', type: 'izin', reason: '' });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resHistory = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const history = resHistory.data.data;
        setStudentHistory(history);

        // Cek status hari ini
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = history.find(r => r.date === today);
        setTodayStatus(todayRecord || null);

        const resPerm = await axios.get(`${import.meta.env.VITE_API_URL}/api/permissions/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPermissions(resPerm.data.data);
      } catch (err) {
        console.error('Error fetching data', err);
      }
    };
    fetchData();
  }, [token]);

  const handleSubmitIzin = async (e) => {
    e.preventDefault();
    if (!file) return alert('Pilih file surat bukti!');
    
    setIsSubmitting(true);
    const data = new FormData();
    data.append('startDate', formData.startDate);
    data.append('endDate', formData.endDate);
    data.append('type', formData.type);
    data.append('reason', formData.reason);
    data.append('attachment', file);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/permissions`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Pengajuan berhasil dikirim!');
      setPermissions([res.data.data, ...permissions]);
      setFormData({ startDate: '', endDate: '', type: 'izin', reason: '' });
      setFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengajukan izin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusConfig = (status) => {
    const map = {
      hadir: { bg: 'bg-status-hadir', label: 'Hadir ✓', icon: '✅', desc: 'Anda sudah tercatat hadir hari ini' },
      telat: { bg: 'bg-status-telat', label: 'Telat', icon: '⏰', desc: 'Anda tercatat terlambat hari ini' },
      izin:  { bg: 'bg-status-izin', label: 'Izin', icon: '📋', desc: 'Anda sedang dalam status izin' },
      sakit: { bg: 'bg-status-sakit', label: 'Sakit', icon: '🏥', desc: 'Anda sedang dalam status sakit' },
      alfa:  { bg: 'bg-status-alpa', label: 'Alpa', icon: '❌', desc: 'Anda belum melakukan absensi' },
    };
    return map[status] || { bg: 'bg-gray-400', label: status, icon: '❓', desc: '' };
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button 
          onClick={() => setActiveTab('absensi')} 
          className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all ${activeTab === 'absensi' ? 'bg-white text-maroon shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Kehadiran Harian
        </button>
        <button 
          onClick={() => setActiveTab('izin')} 
          className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all ${activeTab === 'izin' ? 'bg-white text-maroon shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Pengajuan Izin / Sakit
        </button>
      </div>

      {activeTab === 'absensi' && (
        <>
          {/* Status Card Hari Ini */}
          <div className={`rounded-2xl p-6 text-white ${todayStatus ? getStatusConfig(todayStatus.status).bg : 'bg-gray-300'} animate-slide-up`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">Status Hari Ini</p>
                <h3 className="text-2xl font-black">
                  {todayStatus ? getStatusConfig(todayStatus.status).label : 'Belum Absen'}
                </h3>
                <p className="text-sm text-white/80 mt-1">
                  {todayStatus ? getStatusConfig(todayStatus.status).desc : 'Silakan scan QR di gerbang sekolah'}
                </p>
                {todayStatus && (
                  <p className="text-xs text-white/60 mt-2 font-medium">
                    Waktu scan: {new Date(todayStatus.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                  </p>
                )}
              </div>
              <div className="text-5xl opacity-50">
                {todayStatus ? getStatusConfig(todayStatus.status).icon : '⏳'}
              </div>
            </div>
          </div>

          {/* Tombol Scan QR */}
          {!todayStatus && (
            <button 
              onClick={() => navigate('/scanner')}
              className="scan-pulse w-full bg-maroon hover:bg-maroon-dark text-white rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all shadow-xl shadow-maroon/20 hover:shadow-2xl hover:shadow-maroon/30 animate-bounce-in"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zm0 9.75c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zm9.75-9.75c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">Tap untuk Scan Kehadiran</p>
                <p className="text-xs text-white/60 mt-1 font-medium">Arahkan kamera ke QR Code di gerbang</p>
              </div>
            </button>
          )}

          {todayStatus && (
            <button 
              disabled
              className="w-full bg-gray-100 text-gray-400 rounded-2xl p-6 flex items-center justify-center gap-3 cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <span className="text-sm font-semibold">Anda sudah absen hari ini</span>
            </button>
          )}

          {/* Riwayat 5 Hari */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Riwayat Kehadiran</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Tanggal</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Waktu Scan</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {studentHistory.length > 0 ? (
                    studentHistory.slice(0, 10).map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm font-medium">{record.date}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">
                          {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`badge badge-${record.status === 'alfa' ? 'alpa' : record.status}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="px-5 py-10 text-center text-sm text-gray-400">Belum ada riwayat absensi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'izin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6 h-fit">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Formulir Pengajuan</h2>
            <form onSubmit={handleSubmitIzin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Mulai Tanggal</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Sampai Tanggal</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Jenis Pengajuan</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition bg-white">
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Keterangan / Alasan</label>
                <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows="3" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition" placeholder="Tuliskan alasan lengkap..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Foto Bukti (Surat)</label>
                <input type="file" required accept=".jpg,.jpeg,.png,.pdf" onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-maroon file:text-white hover:file:bg-maroon-dark" />
                <p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG, PDF. Maks: 2MB.</p>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-maroon hover:bg-maroon-dark text-white py-3 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Mengirim...
                  </>
                ) : 'Kirim Pengajuan'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Status Pengajuan Anda</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {permissions.length > 0 ? (
                    permissions.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs">{p.startDate} s/d {p.endDate}</td>
                        <td className="px-4 py-3"><span className={`badge badge-${p.type}`}>{p.type}</span></td>
                        <td className="px-4 py-3">
                          <span className={`badge ${p.status === 'approved' ? 'badge-hadir' : p.status === 'rejected' ? 'badge-alpa' : 'badge-telat'}`}>
                            {p.status === 'approved' ? 'Disetujui' : p.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-xs text-gray-400">Belum ada pengajuan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
