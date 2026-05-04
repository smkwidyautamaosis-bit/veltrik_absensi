import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AcademicYearManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [years, setYears] = useState([]);
  const [newYear, setNewYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [targetYearId, setTargetYearId] = useState('');

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'tata_usaha') {
      navigate('/dashboard');
    } else {
      fetchYears();
    }
  }, [user?.role, navigate]);

  const fetchYears = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/academic-years`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setYears(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddYear = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/academic-years`, { year: newYear }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setNewYear('');
      fetchYears();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambah tahun ajaran');
    }
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Aktifkan tahun ajaran ini? Tahun ajaran lain akan dinonaktifkan.')) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/academic-years/${id}/activate`, {}, {
        headers: { Authorization: `Bearer ${token}`}
      });
      fetchYears();
    } catch (err) {
      alert('Gagal mengaktifkan tahun ajaran');
    }
  };

  const handlePromote = async () => {
    if (!targetYearId) return alert('Pilih tahun ajaran tujuan');
    
    const confirmText = "PERINGATAN KRITIKAL:\n\n1. Siswa Kelas X akan naik ke XI\n2. Siswa Kelas XI akan naik ke XII\n3. Siswa Kelas XII akan menjadi ALUMNI\n\nProses ini tidak bisa dibatalkan. Lanjutkan?";
    if (!window.confirm(confirmText)) return;

    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/academic-years/promote`, { targetYearId }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      alert(`Sukses!\nPromosi: ${res.data.summary.promoted}\nLulus: ${res.data.summary.graduated}\nDiskip: ${res.data.summary.skipped} (Kelas belum tersedia)`);
      setShowPromoteModal(false);
      fetchYears();
    } catch (err) {
      alert('Gagal memproses kenaikan kelas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Tahun Ajaran</h1>
            <p className="text-gray-500 text-sm">Kelola tahun akademik dan proses kenaikan kelas massal.</p>
          </div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
          >
            Kembali
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Form Tambah */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h3 className="font-bold text-gray-900 mb-4">Tambah Tahun Ajaran</h3>
            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tahun (Format: 2024/2025)</label>
                <input 
                  type="text" 
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="Contoh: 2025/2026"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-maroon text-white py-2 rounded-md text-sm font-bold hover:bg-black transition">
                Simpan
              </button>
            </form>
          </div>

          {/* List Tahun Ajaran */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900">Daftar Tahun Ajaran</h3>
              <button 
                onClick={() => setShowPromoteModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md text-xs font-bold hover:bg-orange-700 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Proses Kenaikan Kelas (Massal)
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-bold text-gray-600">Tahun Ajaran</th>
                    <th className="px-6 py-3 font-bold text-gray-600">Status</th>
                    <th className="px-6 py-3 font-bold text-gray-600 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {years.map(y => (
                    <tr key={y._id}>
                      <td className="px-6 py-4 font-bold text-gray-900">{y.year}</td>
                      <td className="px-6 py-4">
                        {y.isActive ? (
                          <span className="px-2 py-1 text-[10px] bg-green-100 text-green-700 rounded-full font-bold uppercase">Aktif</span>
                        ) : (
                          <span className="px-2 py-1 text-[10px] bg-gray-100 text-gray-500 rounded-full font-bold uppercase">Non-Aktif</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!y.isActive && (
                          <button 
                            onClick={() => handleActivate(y._id)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                          >
                            Aktifkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Promosi */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-orange-50">
              <h3 className="text-lg font-bold text-orange-800">Proses Kenaikan Kelas Massal</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                <p className="text-xs text-red-800 leading-relaxed">
                  <strong>PENTING:</strong> Sebelum melakukan promosi, pastikan Anda sudah membuat <strong>Kelas-kelas baru</strong> di Tahun Ajaran tujuan. Sistem akan memindahkan siswa berdasarkan nama kelas yang sama (Contoh: X Perhotelan 1 ke XI Perhotelan 1).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Pilih Tahun Ajaran Tujuan</label>
                <select 
                  value={targetYearId}
                  onChange={(e) => setTargetYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm outline-none bg-white"
                >
                  <option value="">-- Pilih Tahun --</option>
                  {years.map(y => (
                    <option key={y._id} value={y._id}>{y.year}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                >
                  Batal
                </button>
                <button 
                  onClick={handlePromote}
                  disabled={isLoading || !targetYearId}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md text-sm font-bold hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Sedang Memproses...' : 'Eksekusi Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
