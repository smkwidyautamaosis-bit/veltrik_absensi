import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppSidebar from '../components/AppSidebar';

export default function TeacherManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    password: 'Masuk123',
    nip: '',
    phoneNumber: '',
    gender: 'Laki-laki',
    teacherType: 'produktif',
    role: 'wali_kelas'
  });
  const [isEditing, setIsEditing] = useState(false);
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

  const fetchTeachers = async () => {
    try {
      const [guruRes, waliRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=guru`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=wali_kelas`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTeachers([...(guruRes.data.data || []), ...(waliRes.data.data || [])]);
    } catch (err) {
      console.error('Gagal mengambil data guru', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'tata_usaha') {
      navigate('/dashboard');
    } else {
      fetchTeachers();
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
      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Data guru berhasil diperbarui.');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Data guru berhasil ditambahkan.');
      }
      setFormData({ id: null, name: '', email: '', password: 'Masuk123', nip: '', phoneNumber: '', gender: 'Laki-laki', teacherType: 'produktif', role: 'wali_kelas' });
      setIsEditing(false);
      fetchTeachers(); 
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan data guru.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSuccess('Data guru berhasil dihapus.');
      fetchTeachers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus data guru.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleEdit = (teacher) => {
    setIsEditing(true);
    setFormData({
      id: teacher._id,
      name: teacher.name || '',
      email: teacher.email || '',
      password: 'Masuk123',
      nip: teacher.nip || '',
      phoneNumber: teacher.phoneNumber || '',
      gender: teacher.gender || 'Laki-laki',
      teacherType: teacher.teacherType || 'produktif',
      role: teacher.role || 'wali_kelas'
    });
    setShowFormModal(true);
  };

  const handleExport = () => {
    if (teachers.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Lengkap,NIP,Email,No. HP,Jenis Kelamin\n";
    
    teachers.forEach(row => {
      const cleanName = `"${row.name || ''}"`;
      const cleanEmail = `"${row.email || ''}"`;
      const rowData = [cleanName, row.nip, cleanEmail, row.phoneNumber, row.gender].join(",");
      csvContent += rowData + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Guru_Wali_Kelas_SMK_Widya_Utama.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 font-poppins text-gray-900 overflow-hidden">
      <AppSidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        
        {/* Header Flat & Minimalis */}
        <div className="flex justify-between items-end pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Guru / Wali Kelas</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola master data pendidik SMK Widya Utama.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleExport}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({ id: null, name: '', email: '', password: 'Masuk123', nip: '', phoneNumber: '', gender: 'Laki-laki', teacherType: 'produktif', role: 'wali_kelas' });
                setShowFormModal(true);
              }}
              className="px-4 py-2 text-sm font-semibold text-white rounded-md transition"
              style={{ background: '#800000' }}
            >
              Tambah Guru
            </button>
          </div>
        </div>

        {/* Notifikasi Flat */}
        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-md text-sm font-medium">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-md text-sm font-medium">{success}</div>}

        <div className="bg-white rounded-md border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Direktori Guru</h2>
              <span className="text-xs text-gray-500 font-medium">{teachers.length} Total Data</span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NIP</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role / Tipe</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kontak</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teachers.length > 0 ? (
                    teachers.map((teacher) => (
                      <tr key={teacher._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{teacher.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">{teacher.nip}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold text-gray-800">{teacher.role}</span>
                          <div className="text-gray-500">{teacher.teacherType || 'produktif'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-500">{teacher.email}</span>
                            <span className="text-xs text-gray-400">{teacher.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleEdit(teacher)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider transition mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteTarget(teacher)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">Belum ada data guru terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFormModal(false)}>
          <div className="bg-white w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{isEditing ? 'Edit Guru' : 'Tambah Guru'}</h3>
              <button onClick={() => setShowFormModal(false)}>X</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Nama Lengkap" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <input type="text" name="nip" value={formData.nip} onChange={handleChange} required placeholder="NIP / NUPTK" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="No HP" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <input type="text" name="password" value={formData.password} onChange={handleChange} required placeholder="Password" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md" />
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select>
              <select name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"><option value="guru">Guru</option><option value="wali_kelas">Wali Kelas</option></select>
              <select name="teacherType" value={formData.teacherType} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md bg-white"><option value="produktif">Produktif</option><option value="tidak_tetap">Tidak Tetap</option></select>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md text-white text-sm font-semibold" style={{ background: '#800000' }}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white w-full max-w-sm rounded-xl p-5" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-bold text-gray-900 mb-2">Konfirmasi Hapus</h4>
            <p className="text-sm text-gray-600 mb-4">Yakin ingin menghapus {deleteTarget.name}?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-md bg-gray-100 text-sm font-semibold">Batal</button>
              <button onClick={async () => { await handleDelete(deleteTarget._id); setDeleteTarget(null); }} className="px-4 py-2 rounded-md bg-red-600 text-white text-sm font-semibold">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}