import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ClassManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    major: '',
    level: 'X',
    academicYear: '2024/2025',
    capacity: 36,
    waliKelasId: ''
  });

  const fetchData = async () => {
    try {
      const [classRes, teacherRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, {
          headers: { Authorization: `Bearer ${token}`}
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=wali_kelas`, {
          headers: { Authorization: `Bearer ${token}`}
        })
      ]);
      setClasses(classRes.data.data);
      setTeachers(teacherRes.data.data);
    } catch (err) {
      console.error('Gagal mengambil data', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'tata_usaha') {
      navigate('/dashboard');
    } else {
      fetchData();
    }
  }, [user?.role, navigate, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = { ...formData };
      if (!payload.waliKelasId) delete payload.waliKelasId;

      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/classes/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}`}
        });
        setSuccess('Data kelas berhasil diperbarui.');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/classes`, payload, {
          headers: { Authorization: `Bearer ${token}`}
        });
        setSuccess('Data kelas berhasil ditambahkan.');
      }
      
      setFormData({ name: '', major: '', level: 'X', academicYear: '2024/2025', capacity: 36, waliKelasId: '' });
      setIsEditing(false);
      setEditId(null);
      fetchData(); 
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data kelas.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cls) => {
    setIsEditing(true);
    setEditId(cls._id);
    setFormData({
      name: cls.name,
      major: cls.major,
      level: cls.level,
      academicYear: cls.academicYear || '',
      capacity: cls.capacity,
      waliKelasId: cls.waliKelasId?._id || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', major: '', level: 'X', academicYear: '2024/2025', capacity: 36, waliKelasId: '' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus permanen data kelas ini? Data siswa tidak akan terhapus, namun tidak akan memiliki kelas.')) return;
    
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSuccess('Data kelas berhasil dihapus.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus data kelas.');
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Arsipkan kelas ini? Kelas yang diarsipkan tidak akan muncul di daftar aktif.')) return;
    
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/classes/${id}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSuccess('Data kelas berhasil diarsipkan.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengarsipkan data kelas.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins text-gray-900 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-end pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-maroon">Manajemen Data Kelas</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola rombongan belajar dan jurusan secara dinamis.</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-semibold text-white bg-maroon border border-transparent hover:bg-maroon-dark transition">
            Kembali
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 text-sm font-medium">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 p-4 text-sm font-medium">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 border border-gray-200 lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-maroon mb-6 uppercase tracking-wider">{isEditing ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Kelas</label>
                <input type="text" name="name" placeholder="Contoh: Perhotelan 1" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-maroon transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jurusan</label>
                <input type="text" name="major" placeholder="Contoh: Perhotelan" value={formData.major} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-maroon transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tingkat</label>
                  <select name="level" value={formData.level} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-maroon transition bg-white">
                    <option value="X">X</option>
                    <option value="XI">XI</option>
                    <option value="XII">XII</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kapasitas</label>
                  <input type="number" name="capacity" min="1" value={formData.capacity} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-maroon transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tahun Ajaran</label>
                <input type="text" name="academicYear" placeholder="Contoh: 2024/2025" value={formData.academicYear} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-maroon transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Wali Kelas (Opsional)</label>
                <select name="waliKelasId" value={formData.waliKelasId} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-maroon transition bg-white">
                  <option value="">-- Pilih Wali Kelas --</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div className="pt-2 flex gap-2">
                <button type="submit" disabled={isLoading} className="flex-1 bg-maroon text-white py-2.5 text-sm font-semibold hover:bg-maroon-dark transition disabled:bg-gray-400">
                  {isLoading ? 'Menyimpan...' : isEditing ? 'Update Data' : 'Simpan Data'}
                </button>
                {isEditing && (
                  <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white border border-gray-200 lg:col-span-2 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white">
              <h2 className="text-sm font-bold text-maroon uppercase tracking-wider">Direktori Kelas Aktif</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tingkat/Jurusan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tahun Ajaran</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wali Kelas</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classes.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Belum ada kelas aktif.</td></tr>
                  ) : classes.map((cls) => (
                    <tr key={cls._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{cls.name}</td>
                      <td className="px-6 py-4 text-gray-500">{cls.level} - {cls.major}</td>
                      <td className="px-6 py-4 text-gray-500">{cls.academicYear || '-'}</td>
                      <td className="px-6 py-4 text-gray-500">{cls.waliKelasId ? cls.waliKelasId.name : '-'}</td>
                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        <button onClick={() => handleEdit(cls)} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider">Edit</button>
                        <button onClick={() => handleArchive(cls._id)} className="text-yellow-600 hover:text-yellow-800 text-xs font-bold uppercase tracking-wider">Arsip</button>
                        <button onClick={() => handleDelete(cls._id)} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}