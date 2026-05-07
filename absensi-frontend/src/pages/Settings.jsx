import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DEFAULT_ACTIVE_DAYS = {
  X: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  XI: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  XII: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
};

export default function Settings() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [config, setConfig] = useState({
    school_lat: '',
    school_lng: '',
    max_radius: '',
    activeDaysByLevel: DEFAULT_ACTIVE_DAYS,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [classXII, setClassXII] = useState([]);
  const [pklPeriods, setPklPeriods] = useState([]);
  const [pklLoading, setPklLoading] = useState(false);
  const [pklSaving, setPklSaving] = useState(false);
  const [pklForm, setPklForm] = useState({
    classId: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'tata_usaha')) {
      navigate('/dashboard');
      return;
    }
    fetchAllData();
  }, [user?.role, token]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [configRes, classRes, pklRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/config`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pkl`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      if (configRes.data.success) {
        setConfig({
          school_lat: configRes.data.data.school_lat || '',
          school_lng: configRes.data.data.school_lng || '',
          max_radius: configRes.data.data.max_radius || '',
          activeDaysByLevel: configRes.data.data.activeDaysByLevel || DEFAULT_ACTIVE_DAYS,
        });
      }
      const allClasses = classRes.data.data || [];
      const xiiClasses = allClasses.filter((item) => item.level === 'XII');
      setClassXII(xiiClasses);
      if (!pklForm.classId && xiiClasses.length > 0) {
        setPklForm((prev) => ({ ...prev, classId: xiiClasses[0]._id }));
      }
      setPklPeriods(pklRes.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data settings', err);
      setError('Gagal memuat data pengaturan dari server');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const toggleActiveDay = (level, day) => {
    setConfig((prev) => {
      const existing = prev.activeDaysByLevel[level] || [];
      const isChecked = existing.includes(day);
      const updatedDays = isChecked
        ? existing.filter((d) => d !== day)
        : [...existing, day];
      return {
        ...prev,
        activeDaysByLevel: {
          ...prev.activeDaysByLevel,
          [level]: updatedDays,
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/config`, config, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const getLocationFromDevice = () => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung GPS');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setConfig((prev) => ({
          ...prev,
          school_lat: position.coords.latitude,
          school_lng: position.coords.longitude
        }));
        setMessage('Koordinat berhasil didapatkan dari perangkat Anda.');
        setError('');
      },
      () => {
        setError('Gagal mengambil lokasi. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePKLChange = (e) => {
    setPklForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreatePKL = async (e) => {
    e.preventDefault();
    setPklSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/pkl`, pklForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(response.data.message || 'Periode PKL berhasil dibuat');
      setPklForm((prev) => ({ ...prev, startDate: '', endDate: '', description: '' }));
      await fetchPKL();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat periode PKL');
    } finally {
      setPklSaving(false);
    }
  };

  const fetchPKL = async () => {
    setPklLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pkl`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPklPeriods(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat periode PKL');
    } finally {
      setPklLoading(false);
    }
  };

  const handleEndPKL = async (id) => {
    if (!window.confirm('Yakin ingin mengakhiri periode PKL ini sekarang?')) return;
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/pkl/${id}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(response.data.message || 'Periode PKL diakhiri');
      await fetchPKL();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengakhiri periode PKL');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10 shrink-0">
        <div className="px-6 py-8 border-b border-gray-100 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-maroon leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-semibold">Sistem Absensi</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition"
          >
            Dashboard
          </button>
          
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Sistem</div>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-maroon bg-blue-50/50 rounded-md transition">
            Pengaturan
          </button>
        </nav>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-maroon leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Pengaturan</p>
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
        <div className="max-w-2xl mx-auto pb-10">
          <div className="mb-8 md:mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Pengaturan Sistem</h2>
            <p className="text-gray-500 text-xs md:text-sm mt-1">Atur konfigurasi GPS, hari aktif tingkat, dan periode PKL kelas XII.</p>
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

          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Konfigurasi GPS & Radius</h3>
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Latitude Sekolah</label>
                    <input 
                      type="number" 
                      step="any"
                      name="school_lat"
                      value={config.school_lat}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Longitude Sekolah</label>
                    <input 
                      type="number" 
                      step="any"
                      name="school_lng"
                      value={config.school_lng}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <button 
                    type="button"
                    onClick={getLocationFromDevice}
                    className="text-xs font-semibold text-maroon bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition"
                  >
                    + Gunakan Lokasi Saat Ini (Perangkat Anda)
                  </button>
                  <p className="text-[10px] text-gray-500 mt-2">Pastikan Anda berada di area sekolah jika menggunakan fitur ini.</p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Batas Radius Absensi (Meter)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      name="max_radius"
                      value={config.max_radius}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 text-sm">
                      meter
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Siswa di luar jarak ini tidak akan bisa melakukan absensi.</p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Hari Aktif per Tingkat</h4>
                  {['X', 'XI', 'XII'].map((level) => (
                    <div key={level} className="mb-4 p-3 border border-gray-100 rounded-md">
                      <p className="text-xs font-bold text-gray-700 mb-2">Kelas {level}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {DAYS.map((day) => (
                          <label key={`${level}-${day}`} className="flex items-center gap-2 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              checked={(config.activeDaysByLevel[level] || []).includes(day)}
                              onChange={() => toggleActiveDay(level, day)}
                              className="accent-maroon"
                            />
                            {level === 'X' && day === 'Sabtu' ? 'Pramuka' : day}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-500">Sabtu khusus Kelas X ditampilkan sebagai Pramuka.</p>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className={`w-full text-white font-semibold rounded-md text-sm px-5 py-3 transition ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-maroon hover:bg-maroon-dark'}`}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Periode PKL</h3>

            <form onSubmit={handleCreatePKL} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kelas XII</label>
                <select
                  name="classId"
                  value={pklForm.classId}
                  onChange={handlePKLChange}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                  required
                >
                  <option value="">-- Pilih Kelas XII --</option>
                  {classXII.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} {item.major} ({item.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tanggal Mulai</label>
                  <input
                    type="date"
                    name="startDate"
                    value={pklForm.startDate}
                    onChange={handlePKLChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tanggal Selesai</label>
                  <input
                    type="date"
                    name="endDate"
                    value={pklForm.endDate}
                    onChange={handlePKLChange}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Deskripsi (Opsional)</label>
                <textarea
                  name="description"
                  value={pklForm.description}
                  onChange={handlePKLChange}
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon block p-3 transition"
                />
              </div>

              <button
                type="submit"
                disabled={pklSaving}
                className={`text-white font-semibold rounded-md text-sm px-5 py-2.5 transition ${pklSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-maroon hover:bg-maroon-dark'}`}
              >
                {pklSaving ? 'Menyimpan...' : 'Simpan Periode PKL'}
              </button>
            </form>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Daftar Periode PKL</h4>
              {(loading || pklLoading) ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-maroon"></div>
                </div>
              ) : pklPeriods.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada periode PKL.</p>
              ) : (
                <div className="space-y-2">
                  {pklPeriods.map((pkl) => (
                    <div key={pkl._id} className="border border-gray-100 rounded-md p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {pkl.classId?.name} {pkl.classId?.major}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(pkl.startDate).toLocaleDateString('id-ID')} - {new Date(pkl.endDate).toLocaleDateString('id-ID')}
                        </p>
                        {pkl.description && <p className="text-xs text-gray-500 mt-1">{pkl.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${pkl.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {pkl.isActive ? 'Aktif' : 'Selesai'}
                        </span>
                        {pkl.isActive && (
                          <button
                            onClick={() => handleEndPKL(pkl._id)}
                            className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md transition"
                          >
                            Akhiri PKL
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
