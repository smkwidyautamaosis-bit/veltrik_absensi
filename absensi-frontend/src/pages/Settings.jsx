import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Settings() {
  const navigate = useNavigate();
  // Gunakan useState lazy init agar objek user tidak dire-create di setiap render
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [config, setConfig] = useState({
    school_lat: '',
    school_lng: '',
    max_radius: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Only Admin or TU can access Settings
    if (!user || (user.role !== 'admin' && user.role !== 'tata_usaha')) {
      navigate('/dashboard');
      return;
    }
    fetchConfig();
    // Gunakan user.role agar reference aman, dan hapus navigate karena ia fungsi stabil dari hook
  }, [user?.role, token]);

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/config`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      
      if (response.data.success) {
        setConfig({
          school_lat: response.data.data.school_lat || '',
          school_lng: response.data.data.school_lng || '',
          max_radius: response.data.data.max_radius || ''
        });
      }
    } catch (err) {
      console.error('Gagal memuat konfigurasi', err);
      setError('Gagal memuat konfigurasi dari server');
    } finally {
      // Dijamin tereksekusi
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
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
      (geoError) => {
        setError('Gagal mengambil lokasi. Pastikan izin lokasi aktif.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10 shrink-0">
        <div className="px-6 py-8 border-b border-gray-100 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
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
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-[#183057] bg-blue-50/50 rounded-md transition">
            Pengaturan
          </button>
        </nav>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
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
            <p className="text-gray-500 text-xs md:text-sm mt-1">Atur koordinat sekolah dan batas radius absensi.</p>
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

          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Konfigurasi GPS & Radius</h3>
            
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#183057]"></div>
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
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] block p-3 transition"
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
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] block p-3 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <button 
                    type="button"
                    onClick={getLocationFromDevice}
                    className="text-xs font-semibold text-[#183057] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-md transition"
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
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] block p-3 transition"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 text-sm">
                      meter
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">Siswa di luar jarak ini tidak akan bisa melakukan absensi.</p>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className={`w-full text-white font-semibold rounded-md text-sm px-5 py-3 transition ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#183057] hover:bg-[#112240]'}`}
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
