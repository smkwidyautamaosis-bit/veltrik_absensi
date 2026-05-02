import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SiswaDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [studentHistory, setStudentHistory] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activeTab, setActiveTab] = useState('absensi'); // 'absensi' | 'izin'

  // State form izin
  const [formData, setFormData] = useState({ startDate: '', endDate: '', type: 'izin', reason: '' });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resHistory = await axios.get('http://localhost:5000/api/attendance/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStudentHistory(resHistory.data.data);

        const resPerm = await axios.get('http://localhost:5000/api/permissions/me', {
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
      const res = await axios.post('http://localhost:5000/api/permissions', data, {
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('absensi')} 
          className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'absensi' ? 'border-[#183057] text-[#183057]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Kehadiran Harian
        </button>
        <button 
          onClick={() => setActiveTab('izin')} 
          className={`text-sm font-bold pb-2 border-b-2 transition-colors ${activeTab === 'izin' ? 'border-[#183057] text-[#183057]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Pengajuan Izin / Sakit
        </button>
      </div>

      {activeTab === 'absensi' && (
        <>
          <div className="bg-white border border-gray-200 p-8 rounded-lg flex flex-col items-start justify-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Waktunya Absen</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">Pastikan Anda sudah berada di area sekolah sebelum memindai QR Code.</p>
            <button 
              onClick={() => navigate('/scanner')}
              className="bg-[#183057] text-white px-6 py-3 rounded-md text-sm font-bold hover:bg-[#112240] transition-colors"
            >
              Buka Kamera Scanner
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Riwayat Kehadiran Anda</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu Scan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentHistory.length > 0 ? (
                    studentHistory.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 text-sm font-medium">{record.date}</td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${record.status === 'hadir' ? 'bg-green-50 text-green-700' : record.status === 'telat' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="px-6 py-10 text-center text-sm text-gray-500">Belum ada riwayat absensi.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'izin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6 rounded-lg h-fit">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Formulir Pengajuan</h2>
            <form onSubmit={handleSubmitIzin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mulai Tanggal</label>
                  <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full text-sm border border-gray-200 rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
                  <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full text-sm border border-gray-200 rounded px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Jenis Pengajuan</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full text-sm border border-gray-200 rounded px-3 py-2">
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Keterangan / Alasan</label>
                <textarea required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows="3" className="w-full text-sm border border-gray-200 rounded px-3 py-2" placeholder="Tuliskan alasan lengkap..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Foto Bukti (Surat)</label>
                <input type="file" required accept=".jpg,.jpeg,.png,.pdf" onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#183057] file:text-white hover:file:bg-[#112240]" />
                <p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG, PDF. Maks: 2MB.</p>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-[#183057] text-white py-2.5 rounded-md text-sm font-bold mt-2 disabled:opacity-50">
                {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-fit">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Status Pengajuan Anda</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipe</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {permissions.length > 0 ? (
                    permissions.map(p => (
                      <tr key={p._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs">{p.startDate} s/d {p.endDate}</td>
                        <td className="px-4 py-3 text-xs uppercase font-bold text-gray-500">{p.type}</td>
                        <td className="px-4 py-3 text-xs">
                          <span className={`px-2 py-1 rounded font-bold uppercase tracking-wider text-[10px] ${p.status === 'approved' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="px-4 py-8 text-center text-xs text-gray-500">Belum ada pengajuan.</td></tr>
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
