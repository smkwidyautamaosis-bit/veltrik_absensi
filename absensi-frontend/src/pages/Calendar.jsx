import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppSidebar from '../components/AppSidebar';

export default function Calendar() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!deleteTarget) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteTarget]);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'tata_usaha')) {
      navigate('/dashboard');
      return;
    }
    fetchHolidays();
  }, [user?.role, token]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/holidays`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setHolidays(response.data.data);
    } catch (err) {
      setError('Gagal memuat data hari libur dari server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/holidays/sync`, {}, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setMessage(response.data.message);
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal sinkronisasi data.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDate || !newDesc) return;
    setMessage('');
    setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/holidays`, { date: newDate, description: newDesc }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setNewDate('');
      setNewDesc('');
      setMessage('Hari libur berhasil ditambahkan.');
      fetchHolidays();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan libur manual.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/holidays/${id}`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      fetchHolidays();
    } catch (err) {
      setError('Gagal menghapus hari libur.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      
      <AppSidebar user={user} onLogout={handleLogout} />

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-maroon leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Kalender Sekolah</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
        >
          Kembali
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
        <div className="max-w-4xl mx-auto pb-10">
          
          <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Kalender & Hari Libur</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Sistem absensi akan ditolak otomatis pada hari libur terdaftar.</p>
            </div>
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`text-xs font-bold text-white px-5 py-2.5 rounded-md transition ${syncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-maroon hover:bg-maroon-dark'}`}
            >
              {syncing ? 'Menyinkronkan...' : '🔄 Sync Libur Nasional API'}
            </button>
          </div>

          {message && (
            <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-md border border-green-200 text-sm font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md border border-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tabel Hari Libur */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-900">Daftar Hari Libur Terdaftar</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
                  </div>
                ) : holidays.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">Belum ada hari libur. Silakan sync API atau tambah manual.</div>
                ) : (
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Keterangan</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {holidays.map(h => {
                        const dateObj = new Date(h.date);
                        const formattedDate = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
                        return (
                          <tr key={h._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3 whitespace-nowrap text-gray-900 font-medium text-xs">{formattedDate}</td>
                            <td className="px-5 py-3 text-xs">{h.description}</td>
                            <td className="px-5 py-3 text-right">
                              <button 
                                onClick={() => setDeleteTarget(h)}
                                className="text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition"
                              >
                                Hapus
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Form Tambah Manual */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col h-max">
              <h3 className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Tambah Libur Custom</h3>
              <p className="text-[10px] text-gray-500 mb-5">Tambahkan libur khusus sekolah (misal: Ulang Tahun Sekolah, Rapat Guru).</p>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pilih Tanggal</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Keterangan Libur</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: HUT Sekolah"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
                    required
                  />
                </div>
                <div className="pt-2">
                  <button 
                    type="submit" 
                    className="w-full text-white bg-maroon hover:bg-maroon-dark font-semibold rounded-md text-xs px-4 py-2.5 transition"
                  >
                    + Simpan ke Kalender
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>
      </main>
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold mb-2">Konfirmasi Hapus</h4>
            <p className="text-sm text-gray-600 mb-4">Yakin ingin menghapus libur "{deleteTarget.description}"?</p>
            <div className="flex justify-end gap-2"><button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button><button onClick={async () => { await handleDelete(deleteTarget._id); setDeleteTarget(null); }} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold">Ya, Hapus</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
