import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    nisn: '',
    email: '',
    password: 'Masuk123',
    phoneNumber: '',
    gender: 'Laki-laki',
    classId: '',
    studentStatus: 'Aktif',
    joinDate: new Date().toISOString().split('T')[0],
    previousSchool: ''
  });

  const [classes, setClasses] = useState([]);
  
  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users?role=siswa`, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setStudents(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil data siswa', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${token}`}
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
      fetchStudents();
      fetchClasses();
    }
  }, [user?.role, navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };

    // Auto generate email jika NISN berubah
    if (name === 'nisn') {
      newFormData.email = value ? `${value}@smkwidyautama.sch.id`: '';
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, { ...formData, role: 'siswa' }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSuccess('Siswa berhasil ditambahkan.');
      setFormData({ 
        name: '', nisn: '', email: '', password: 'Masuk123', 
        phoneNumber: '', gender: 'Laki-laki', classId: '', 
        studentStatus: 'Aktif', joinDate: new Date().toISOString().split('T')[0], 
        previousSchool: '' 
      });
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
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}`}
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
    link.setAttribute("download", "Data_Siswa_SMK_Widya_Utama.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/students/template`, {
        headers: { Authorization: `Bearer ${token}`},
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Template_Import_Siswa.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mengunduh template');
    }
  };

  const handleFileChange = (e) => {
    setImportFile(e.target.files[0]);
  };

  const handleUploadPreview = async () => {
    if (!importFile) return alert('Pilih file terlebih dahulu');
    setIsImportLoading(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/students/import`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setImportPreview(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal upload file');
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    const validStudents = importPreview.filter(s => s.status === 'valid' || s.status === 'warning');
    const errorCount = importPreview.filter(s => s.status === 'error').length;

    if (validStudents.length === 0) {
      alert('Tidak ada data valid untuk diimport');
      return;
    }

    if (errorCount > 0) {
      if (!window.confirm(`${errorCount} baris akan diskip karena error, lanjutkan?`)) return;
    }

    setIsImportLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/students/import/confirm`, { students: validStudents }, {
        headers: { Authorization: `Bearer ${token}`}
      });
      setSuccess(`${validStudents.length} siswa berhasil diimport!`);
      setShowImportModal(false);
      setImportPreview([]);
      setImportFile(null);
      fetchStudents();
    } catch (err) {
      alert('Gagal mengkonfirmasi import');
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleDownloadAccountsExcel = () => {
    if (students.length === 0) return alert('Tidak ada data siswa');

    // Sheet 1: Data Lengkap
    const sheet1Data = students.map((s, idx) => ({
      'No': idx + 1,
      'Nama': s.name,
      'NISN': s.nisn,
      'Kelas': s.classId ? s.classId.name : '-',
      'Tingkat': s.classId ? s.classId.level : '-',
      'Email': s.email,
      'Password': 'Masuk123', // Default password
      'Status': s.studentStatus
    }));

    // Sheet 2: Rekap Per Kelas
    const classStats = {};
    students.forEach(s => {
      const cName = s.classId ? s.classId.name : 'Tanpa Kelas';
      classStats[cName] = (classStats[cName] || 0) + 1;
    });
    const sheet2Data = Object.keys(classStats).map(c => ({
      'Kelas': c,
      'Jumlah Siswa': classStats[c]
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(sheet1Data);
    const ws2 = XLSX.utils.json_to_sheet(sheet2Data);

    XLSX.utils.book_append_sheet(wb, ws1, "Data Lengkap Akun");
    XLSX.utils.book_append_sheet(wb, ws2, "Rekap Per Kelas");

    XLSX.writeFile(wb, "Daftar_Akun_Siswa_SMK_Widya_Utama.xlsx");
  };

  const handleDownloadAccountsPDF = () => {
    try {
      if (students.length === 0) return alert('Tidak ada data siswa');

      const doc = new jsPDF();
      const groupedStudents = {};

      // Group by class
      students.forEach(s => {
        const cId = s.classId ? s.classId._id : 'no-class';
        const cLevel = s.classId?.level || '';
        const cName = s.classId ? `${cLevel} ${s.classId.name}`: 'Tanpa Kelas';
        if (!groupedStudents[cId]) groupedStudents[cId] = { name: cName, list: [] };
        groupedStudents[cId].list.push(s);
      });

      Object.keys(groupedStudents).forEach((cId, index) => {
        if (index > 0) doc.addPage();

        // Header
        doc.setFontSize(16);
        doc.text('SMK WIDYA UTAMA', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('DAFTAR AKUN LOGIN SISWA', 105, 30, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Kelas: ${groupedStudents[cId].name}`, 14, 45);

        const tableData = groupedStudents[cId].list.map((s, idx) => [
          idx + 1,
          s.name,
          s.email,
          'Masuk123'
        ]);

        autoTable(doc, {
          startY: 50,
          head: [['No', 'Nama Siswa', 'Email Login', 'Password']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [24, 48, 87] },
          styles: { fontSize: 10 },
          didDrawPage: (data) => {
            // Footer per page if needed
          }
        });

        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text('* Harap ganti password setelah login pertama untuk keamanan.', 14, finalY + 10);

        // Footer Tanda Tangan
        doc.setFont('helvetica', 'normal');
        doc.text('Mengetahui,', 150, finalY + 25);
        doc.text('Wali Kelas', 150, finalY + 32);
        doc.text('(____________________)', 150, finalY + 55);
      });

      doc.save("Daftar_Akun_Siswa.pdf");
    } catch (err) {
      console.error('PDF Error:', err);
      alert('Gagal membuat PDF: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-poppins text-gray-900 p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Flat & Minimalis */}
        <div className="flex justify-between items-end pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Data Siswa</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola master data dan akses sistem siswa.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
            >
              Import Siswa
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition flex items-center gap-2"
              >
                Download Akun
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDownloadDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                  <button 
                    onClick={() => { handleDownloadAccountsExcel(); setShowDownloadDropdown(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-50"
                  >
                    Format Excel (TU)
                  </button>
                  <button 
                    onClick={() => { handleDownloadAccountsPDF(); setShowDownloadDropdown(false); }} 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Format PDF (Wali Kelas)
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={handleExport}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
            >
              Export CSV List
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
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Kelas & Tingkat</label>
                <select name="classId" value={formData.classId} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white">
                  <option value="" disabled>Pilih Kelas</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.level} - {c.name} {c.major}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email (Auto)</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <input type="text" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">No. HP</label>
                  <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="studentStatus" value={formData.studentStatus} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white">
                    <option value="Aktif">Aktif</option>
                    <option value="Pindahan">Pindahan</option>
                  </select>
                </div>
              </div>

              {formData.studentStatus === 'Pindahan' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Tanggal Masuk</label>
                    <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Sekolah Asal</label>
                    <input type="text" name="previousSchool" value={formData.previousSchool} onChange={handleChange} placeholder="Contoh: SMK Negeri 1 Jakarta" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition" />
                  </div>
                </div>
              )}
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
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {student.name}
                          {student.studentStatus === 'Pindahan' && <span className="ml-2 px-2 py-0.5 text-[10px] bg-orange-100 text-orange-800 rounded-full font-bold">Pindahan</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-mono text-xs">{student.nisn}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {student.classId ? `${student.classId.level || ''} ${student.classId.name}`: '-'}
                        </td>
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

      {/* Modal Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Import Siswa via Excel</h3>
              <button onClick={() => { setShowImportModal(false); setImportPreview([]); }} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {importPreview.length === 0 ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Petunjuk:</strong> Unduh template, isi data siswa, lalu upload di sini. Email dan Password akan digenerate otomatis.
                    </p>
                    <button 
                      onClick={handleDownloadTemplate}
                      className="mt-3 text-sm font-bold text-blue-700 flex items-center gap-1 hover:underline"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Unduh Template Excel
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
                    <input 
                      type="file" 
                      accept=".xlsx, .xls" 
                      id="importFile" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                    <label htmlFor="importFile" className="cursor-pointer">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-gray-900 font-bold">{importFile ? importFile.name : 'Klik untuk pilih file'}</p>
                      <p className="text-gray-500 text-xs mt-1">Format: .xlsx (Excel)</p>
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleUploadPreview}
                      disabled={!importFile || isImportLoading}
                      className="bg-maroon text-white px-6 py-2 rounded-md font-bold text-sm disabled:bg-gray-400"
                    >
                      {isImportLoading ? 'Memproses...' : 'Upload & Preview'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-700">Preview Data ({importPreview.length} baris)</h4>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Valid: {importPreview.filter(s => s.status === 'valid').length}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-yellow-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Warning: {importPreview.filter(s => s.status === 'warning').length}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-600 font-bold">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Error: {importPreview.filter(s => s.status === 'error').length}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[50vh]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-bold text-gray-600">Baris</th>
                          <th className="px-4 py-2 font-bold text-gray-600">NISN</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Nama</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Kelas</th>
                          <th className="px-4 py-2 font-bold text-gray-600">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importPreview.map((item, idx) => (
                          <tr key={idx} className={item.status === 'error' ? 'bg-red-50' : (item.status === 'warning' ? 'bg-yellow-50' : 'bg-white')}>
                            <td className="px-4 py-2 text-gray-500">{item.row}</td>
                            <td className="px-4 py-2 font-bold">{item.nisn}</td>
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2">{item.className} ({item.level})</td>
                            <td className="px-4 py-2">
                              {item.errors.map((e, i) => <p key={i} className="text-red-600 font-medium">• {e}</p>)}
                              {item.warnings.map((w, i) => <p key={i} className="text-yellow-700 font-medium">• {w}</p>)}
                              {item.status === 'valid' && <span className="text-green-600 font-bold">Siap Import</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => setImportPreview([])}
                      className="text-sm font-bold text-gray-500 hover:text-gray-700"
                    >
                      Ganti File
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => { setShowImportModal(false); setImportPreview([]); }}
                        className="px-6 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={handleConfirmImport}
                        disabled={isImportLoading || importPreview.filter(s => s.status !== 'error').length === 0}
                        className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-bold hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {isImportLoading ? 'Mengimport...' : 'Import Semua Yang Valid'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}