import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SubjectManagement() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterMajor, setFilterMajor] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    code: '',
    level: 'Semua',
    major: 'Semua',
  });

  const levels = ['Semua', 'X', 'XI', 'XII'];
  const majors = ['Semua', 'Perhotelan', 'Tata Boga', 'Pariwisata', 'Perbankan'];

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'tata_usaha')) {
      navigate('/dashboard');
      return;
    }
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data mata pelajaran:', err);
      alert('Gagal memuat data mata pelajaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/subjects/${formData.id}`,
          { name: formData.name, code: formData.code, level: formData.level, major: formData.major },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Mata pelajaran berhasil diupdate');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/subjects`,
          { name: formData.name, code: formData.code, level: formData.level, major: formData.major },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Mata pelajaran berhasil ditambahkan');
      }
      resetForm();
      fetchSubjects();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan mata pelajaran');
    }
  };

  const handleEdit = (subj) => {
    setIsEditing(true);
    setFormData({
      id: subj._id,
      name: subj.name,
      code: subj.code || '',
      level: subj.level,
      major: subj.major,
    });
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus mata pelajaran "${name}"?`)) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/subjects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        alert('Mata pelajaran berhasil dihapus');
        fetchSubjects();
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus mata pelajaran');
      }
    }
  };

  const resetForm = () => {
    setFormData({ id: null, name: '', code: '', level: 'Semua', major: 'Semua' });
    setIsEditing(false);
    setShowModal(false);
  };

  const filteredSubjects = subjects.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchLevel = !filterLevel || filterLevel === '' || s.level === filterLevel || s.level === 'Semua';
    const matchMajor = !filterMajor || filterMajor === '' || s.major === filterMajor || s.major === 'Semua';
    return matchSearch && matchLevel && matchMajor;
  });

  const getLevelBadge = (level) => {
    const colors = {
      'X': 'bg-blue-100 text-blue-700',
      'XI': 'bg-purple-100 text-purple-700',
      'XII': 'bg-orange-100 text-orange-700',
      'Semua': 'bg-gray-100 text-gray-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col z-10 shrink-0" style={{ background: 'linear-gradient(180deg, #5C0000 0%, #4A0000 100%)' }}>
        <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">VELTRIK</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest font-medium mt-0.5">Absensi Digital</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-md transition"
          >
            Dashboard
          </button>
          
          <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider mb-3 mt-8 px-2">Akademik</div>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-gold bg-white/10 rounded-md transition">
            Mata Pelajaran
          </button>
          <button 
            onClick={() => navigate('/schedules')}
            className="w-full text-left px-3 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-md transition"
          >
            Jadwal Pelajaran
          </button>
        </nav>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-maroon-dark px-6 py-4 flex justify-between items-center z-20 shrink-0" style={{ background: 'linear-gradient(135deg, #5C0000, #800000)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 shrink-0">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Mata Pelajaran</h1>
            <p className="text-[9px] text-white/50 uppercase tracking-wider font-medium">Master Data</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-white/60 bg-white/10 px-4 py-2 rounded-md hover:bg-white/20 transition"
        >
          Kembali
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
        <div className="max-w-5xl mx-auto pb-10">
          
          {/* Header */}
          <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Master Mata Pelajaran</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Kelola daftar mata pelajaran untuk jadwal dan laporan.</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-lg transition hover:opacity-90 shadow-md"
              style={{ background: 'linear-gradient(135deg, #800000, #5C0000)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Mapel
            </button>
          </div>

          {/* Search & Filter */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Cari nama atau kode mapel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
            />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
            >
              <option value="">Semua Tingkat</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
            >
              <option value="">Semua Jurusan</option>
              {majors.filter(m => m !== 'Semua').map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Daftar Mata Pelajaran</h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{filteredSubjects.length} Mapel</span>
            </div>
            
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon"></div>
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">
                  {subjects.length === 0 ? 'Belum ada mata pelajaran. Tambahkan yang pertama!' : 'Tidak ada hasil pencarian.'}
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Mapel</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kode</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tingkat</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Jurusan</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredSubjects.map((subj) => (
                      <tr key={subj._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-900">{subj.name}</td>
                        <td className="px-5 py-3 text-xs text-gray-500 font-mono">{subj.code || '-'}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getLevelBadge(subj.level)}`}>
                            {subj.level}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs">{subj.major}</td>
                        <td className="px-5 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleEdit(subj)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(subj._id, subj.name)}
                            className="text-red-600 hover:text-red-800 text-xs font-semibold"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => resetForm()}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {isEditing ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
              </h3>
              <button onClick={() => resetForm()} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Mata Pelajaran *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Contoh: Matematika Dasar"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kode Mapel (Opsional)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Contoh: MTK-01"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tingkat</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
                  >
                    {levels.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Jurusan</label>
                  <select
                    value={formData.major}
                    onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-maroon focus:border-maroon p-2.5 transition"
                  >
                    {majors.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-md transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="text-xs font-bold text-white px-6 py-2.5 rounded-md transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #800000, #5C0000)' }}
                >
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Mapel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
