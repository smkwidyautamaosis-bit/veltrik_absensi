import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppSidebar from '../components/AppSidebar';

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
  const [showFormModal, setShowFormModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!showFormModal && !deleteTarget) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowFormModal(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showFormModal, deleteTarget]);

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
      setShowFormModal(false);
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
    setShowFormModal(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: '', major: '', level: 'X', academicYear: '2024/2025', capacity: 36, waliKelasId: '' });
  };

  const handleDelete = async (id) => {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      <AppSidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        <div className="flex justify-between items-end pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-maroon">Manajemen Data Kelas</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola rombongan belajar dan jurusan secara dinamis.</p>
          </div>
          <button onClick={() => { setIsEditing(false); setEditId(null); setFormData({ name: '', major: '', level: 'X', academicYear: '2024/2025', capacity: 36, waliKelasId: '' }); setShowFormModal(true); }} className="px-4 py-2 text-sm font-semibold text-white bg-maroon border border-transparent hover:bg-maroon-dark transition">
            Tambah Kelas
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 text-sm font-medium">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 p-4 text-sm font-medium">{success}</div>}

        <div className="bg-white border border-gray-200 overflow-hidden flex flex-col">
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
                        <button onClick={() => setDeleteTarget(cls)} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFormModal(false)}>
          <div className="bg-white w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between"><h3 className="font-bold">{isEditing ? 'Edit Kelas' : 'Tambah Kelas'}</h3><button onClick={() => setShowFormModal(false)}>X</button></div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <input type="text" name="name" placeholder="Nama Kelas" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <input type="text" name="major" placeholder="Jurusan" value={formData.major} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <div className="grid grid-cols-2 gap-2">
                <select name="level" value={formData.level} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"><option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option></select>
                <input type="number" name="capacity" min="1" value={formData.capacity} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              </div>
              <input type="text" name="academicYear" placeholder="Tahun Ajaran" value={formData.academicYear} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <select name="waliKelasId" value={formData.waliKelasId} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"><option value="">-- Pilih Wali Kelas --</option>{teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
              <div className="pt-2 flex justify-end gap-2"><button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button><button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ background: '#800000' }}>{isLoading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold mb-2">Konfirmasi Hapus</h4>
            <p className="text-sm text-gray-600 mb-4">Yakin ingin menghapus {deleteTarget.name}?</p>
            <div className="flex justify-end gap-2"><button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button><button onClick={async () => { await handleDelete(deleteTarget._id); setDeleteTarget(null); }} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold">Ya, Hapus</button></div>
          </div>
        </div>
      )}
    </div>
  );
}