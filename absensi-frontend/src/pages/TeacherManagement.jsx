import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TeacherManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Masuk123',
    nip: '',
    phoneNumber: '',
    gender: 'Laki-laki'
  });

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=wali_kelas`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setTeachers(response.data.data);
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, { ...formData, role: 'wali_kelas' }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSuccess('Data guru berhasil ditambahkan.');
      setFormData({ name: '', email: '', password: 'Masuk123', nip: '', phoneNumber: '', gender: 'Laki-laki' });
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
    if (!window.confirm('Hapus permanen data guru ini?')) return;
    
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
    <div className="min-h-screen bg-gray-50 font-poppins text-gray-900 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 border border-transparent rounded-md hover:bg-black transition"
            >
              Kembali
            </button>
          </div>
        </div>

        {/* Notifikasi Flat */}
        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-md text-sm font-medium">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-md text-sm font-medium">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Form (Kiri) */}
          <div className="bg-white p-6 rounded-md border border-gray-200 lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Tambah Data Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">NIP / NUPTK</label>
                <input type="text" name="nip" value={formData.nip} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">No. HP</label>
                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password Login (Default: Masuk123)</label>
                <input type="text" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jenis Kelamin</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-black transition disabled:bg-gray-400">
                  {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>

          {/* Panel Tabel (Kanan) */}
          <div className="bg-white rounded-md border border-gray-200 lg:col-span-2 overflow-hidden flex flex-col">
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
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-gray-500">{teacher.email}</span>
                            <span className="text-xs text-gray-400">{teacher.phoneNumber}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(teacher._id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">Belum ada data guru terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}