import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function StudentManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    nisn: '',
    gender: 'Laki-laki'
  });

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil data siswa', err);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'tata_usaha') {
      navigate('/dashboard');
    } else {
      fetchStudents();
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
      await axios.post('http://localhost:5000/api/students', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Siswa berhasil ditambahkan.');
      setFormData({ name: '', email: '', password: '', phoneNumber: '', nisn: '', gender: 'Laki-laki' });
      fetchStudents(); 
      setTimeout(() => setSuccess(''), 3000); // Hilangkan notif setelah 3 detik
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan siswa.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus permanen data siswa ini?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Siswa berhasil dihapus.');
      fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus siswa.');
    }
  };

  // FUNGSI BARU: Export Data ke CSV (Excel)
  const handleExport = () => {
    if (students.length === 0) {
      alert("Tidak ada data untuk diexport!");
      return;
    }

    // 1. Buat Header CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Lengkap,NISN,Email,No. HP,Jenis Kelamin\n";
    
    // 2. Masukkan Data Siswa
    students.forEach(row => {
      // Mengamankan data agar koma di dalam teks tidak merusak kolom Excel
      const cleanName = `"${row.name || ''}"`;
      const cleanEmail = `"${row.email || ''}"`;
      const rowData = [cleanName, row.nisn, cleanEmail, row.phoneNumber, row.gender].join(",");
      csvContent += rowData + "\r\n";
    });

    // 3. Picu Proses Download di Browser
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Data_Siswa_Veltrik.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Flat & Minimalis */}
        <div className="flex justify-between items-end pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Data Siswa</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola master data dan akses sistem siswa.</p>
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
            <h2 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Tambah Siswa Baru</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">NISN</label>
                <input type="text" name="nisn" value={formData.nisn} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
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
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Direktori Siswa</h2>
              <span className="text-xs text-gray-500 font-medium">{students.length} Total Data</span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">NISN</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">{student.nisn}</td>
                        <td className="px-6 py-4 text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(student._id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold uppercase tracking-wider transition"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">Belum ada data siswa terdaftar.</td></tr>
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