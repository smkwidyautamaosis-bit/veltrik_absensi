import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ClassManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Menyesuaikan state dengan model Class.js milik Anda (menggunakan 'name')
  const [formData, setFormData] = useState({
    name: '',
    major: 'Rekayasa Perangkat Lunak'
  });

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil data kelas', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'tata_usaha') {
      navigate('/dashboard');
    } else {
      fetchClasses();
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
      await axios.post('http://localhost:5000/api/classes', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Data kelas berhasil ditambahkan.');
      setFormData({ name: '', major: 'Rekayasa Perangkat Lunak' });
      fetchClasses(); 
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan data kelas.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus permanen data kelas ini?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/classes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Data kelas berhasil dihapus.');
      fetchClasses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus data kelas.');
    }
  };

  const handleExport = () => {
    if (classes.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Kelas,Jurusan\n";
    
    classes.forEach(row => {
      // Menyesuaikan export dengan properti 'name'
      const rowData = [`"${row.name}"`, `"${row.major}"`].join(",");
      csvContent += rowData + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Kelas_Veltrik.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Data Kelas</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola daftar rombongan belajar SMK Widya Utama.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleExport} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition">
              Export CSV
            </button>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 border border-transparent rounded-md hover:bg-black transition">
              Kembali
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-md text-sm font-medium">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-md text-sm font-medium">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="bg-white p-6 rounded-md border border-gray-200 lg:col-span-1 h-fit">
            <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Tambah Kelas Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Kelas</label>
                <input type="text" name="name" placeholder="Contoh: X RPL 1" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Jurusan</label>
                <select name="major" value={formData.major} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white">
                  <option value="Rekayasa Perangkat Lunak">Rekayasa Perangkat Lunak</option>
                  <option value="Teknik Komputer dan Jaringan">Teknik Komputer dan Jaringan</option>
                  <option value="Akuntansi dan Keuangan Lembaga">Akuntansi dan Keuangan Lembaga</option>
                  <option value="Bisnis Daring dan Pemasaran">Bisnis Daring dan Pemasaran</option>
                </select>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white py-2.5 rounded-md text-sm font-semibold hover:bg-black transition disabled:bg-gray-400">
                  {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-md border border-gray-200 lg:col-span-2 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Direktori Kelas</h2>
              <span className="text-xs text-gray-500 font-medium">{classes.length} Total Data</span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Kelas</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Jurusan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <tr key={cls._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{cls.name}</td>
                        <td className="px-6 py-4 text-gray-500">{cls.major}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDelete(cls._id)} className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider transition">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-sm text-gray-500">Belum ada data kelas terdaftar.</td></tr>
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