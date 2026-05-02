import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Report() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
  const token = localStorage.getItem('token');

  const [classes, setClasses] = useState([]);
  const [attendances, setAttendances] = useState([]);
  
  const isWaliKelas = user?.role === 'wali_kelas';

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    classId: isWaliKelas ? user?.classId || '' : ''
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !['admin', 'tata_usaha', 'kepala_sekolah', 'wali_kelas'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
    if (!isWaliKelas) {
      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, token]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClasses(response.data.data);
    } catch (err) {
      console.error('Gagal memuat kelas', err);
    }
  };

  const fetchReport = async () => {
    if (filters.startDate && filters.endDate) {
      if (new Date(filters.endDate) < new Date(filters.startDate)) {
        return alert('Tanggal Akhir tidak boleh lebih kecil dari Tanggal Mulai!');
      }
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.classId) queryParams.append('classId', filters.classId);

      const response = await axios.get(`http://localhost:5000/api/attendance/report?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendances(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil laporan', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'hadir': return 'text-green-700 bg-green-50 border-green-200';
      case 'telat': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'izin': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'sakit': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'alfa': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const calculateStats = (data) => {
    const stats = {};
    data.forEach(item => {
      const studentName = item.student?.name || 'Unknown';
      if (!stats[studentName]) {
        stats[studentName] = { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alpa: 0 };
      }
      const statKey = item.status.charAt(0).toUpperCase() + item.status.slice(1);
      if (statKey === 'Alfa' || statKey === 'Alpa') stats[studentName].Alpa += 1;
      else if (stats[studentName][statKey] !== undefined) stats[studentName][statKey] += 1;
    });
    return stats;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Kop Surat
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SMK WIDYA UTAMA", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Rekapitulasi Kehadiran Siswa", 105, 22, { align: 'center' });
    doc.text(`Periode: ${filters.startDate || 'Awal'} s/d ${filters.endDate || 'Akhir'}`, 105, 28, { align: 'center' });
    doc.line(14, 32, 196, 32);
    
    const tableColumn = ["No", "Tanggal", "Waktu", "Nama Siswa", "Kelas", "Status"];
    const tableRows = [];

    attendances.forEach((record, index) => {
      const date = record.date;
      const time = new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const studentName = record.student?.name || '-';
      const className = record.student?.classId ? `${record.student.classId.name} ${record.student.classId.major}` : '-';
      const status = record.status.toUpperCase();
      
      tableRows.push([index + 1, date, time, studentName, className, status]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 38,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [24, 48, 87] },
      didDrawPage: function (data) {
        // Footer (Page Number)
        doc.setFontSize(8);
        doc.text(
          "Halaman " + doc.internal.getNumberOfPages(),
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    // Signature Area
    const finalY = doc.lastAutoTable.finalY || 40;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Cek apakah halaman cukup untuk tanda tangan, jika tidak add page
    if (finalY > doc.internal.pageSize.height - 40) {
      doc.addPage();
      doc.text(`Dicetak tanggal: ${today}`, 14, 20);
      doc.text("Mengetahui,", 140, 20);
      doc.text(user?.name || "Wali Kelas / Pimpinan", 140, 45);
      doc.line(140, 46, 190, 46);
    } else {
      doc.setFontSize(10);
      doc.text(`Dicetak tanggal: ${today}`, 14, finalY + 15);
      doc.text("Mengetahui,", 140, finalY + 15);
      doc.text(user?.name || "Wali Kelas / Pimpinan", 140, finalY + 40);
      doc.line(140, finalY + 41, 190, finalY + 41);
    }

    doc.save(`Laporan_Absensi_${new Date().getTime()}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Data Lengkap
    const excelData = attendances.map((record, index) => ({
      No: index + 1,
      Tanggal: record.date,
      Waktu: new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      Nama_Siswa: record.student?.name || '-',
      NISN: record.student?.nisn || '-',
      Kelas: record.student?.classId ? `${record.student.classId.name} ${record.student.classId.major}` : '-',
      Status: record.status.toUpperCase()
    }));

    const ws1 = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws1, "Data Lengkap");

    // Sheet 2: Ringkasan
    const stats = calculateStats(attendances);
    const summaryData = Object.keys(stats).map((name, index) => ({
      No: index + 1,
      Nama_Siswa: name,
      Hadir: stats[name].Hadir,
      Telat: stats[name].Telat,
      Izin: stats[name].Izin,
      Sakit: stats[name].Sakit,
      Alpa: stats[name].Alpa
    }));
    
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan Statistik");
    
    XLSX.writeFile(wb, `Laporan_Absensi_${new Date().getTime()}.xlsx`);
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
          
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Laporan</div>
          <button className="w-full text-left px-3 py-2 text-sm font-semibold text-[#183057] bg-blue-50/50 rounded-md transition">
            Export & Laporan
          </button>
        </nav>
      </aside>

      {/* HEADER MOBILE */}
      <header className="md:hidden bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Laporan Absensi</p>
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
        <div className="max-w-6xl mx-auto pb-10">
          
          <div className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Export Laporan</h2>
              <p className="text-gray-500 text-xs md:text-sm mt-1">Filter dan unduh data absensi dalam format PDF atau Excel.</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={exportExcel}
                disabled={attendances.length === 0}
                className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-2.5 rounded-md transition disabled:opacity-50"
              >
                📊 Export Excel
              </button>
              <button 
                onClick={exportPDF}
                disabled={attendances.length === 0}
                className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2.5 rounded-md transition disabled:opacity-50"
              >
                📄 Export PDF
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 md:p-6 mb-6">
            <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-auto">
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tanggal Mulai</label>
                <input 
                  type="date" 
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                />
              </div>
              <div className="w-full md:w-auto">
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Tanggal Akhir</label>
                <input 
                  type="date" 
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  required
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-md focus:ring-[#183057] focus:border-[#183057] p-2.5 transition"
                />
              </div>
              <div className="w-full md:w-auto flex-1">
                <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Filter Kelas</label>
                <select 
                  name="classId"
                  value={filters.classId}
                  onChange={handleFilterChange}
                  disabled={isWaliKelas}
                  className={`w-full text-sm border border-gray-200 rounded-md p-2.5 transition ${isWaliKelas ? 'bg-gray-200 cursor-not-allowed text-gray-500' : 'bg-gray-50 text-gray-900 focus:ring-[#183057] focus:border-[#183057]'}`}
                >
                  {isWaliKelas ? (
                    <option value={user.classId || ''}>Kelas Saya Terkunci</option>
                  ) : (
                    <>
                      <option value="">Semua Kelas</option>
                      {classes.map(c => (
                        <option key={c._id} value={c._id}>{c.name} {c.major}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div className="w-full md:w-auto">
                <button 
                  type="submit" 
                  className="w-full md:w-auto text-white bg-[#183057] hover:bg-[#112240] font-semibold rounded-md text-xs px-6 py-3 transition"
                >
                  Terapkan Filter
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900">Preview Data Absensi</h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{attendances.length} Data Ditemukan</span>
            </div>
            
            <div className="overflow-x-auto max-h-[500px]">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#183057]"></div>
                </div>
              ) : attendances.length === 0 ? (
                <div className="text-center py-10 text-sm text-gray-500">Silakan pilih rentang tanggal dan klik "Terapkan Filter" untuk melihat data.</div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Waktu</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kelas</th>
                      <th className="px-5 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendances.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap text-gray-900 text-xs font-medium">{record.date}</td>
                        <td className="px-5 py-3 text-xs">{new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-5 py-3 text-xs text-gray-900 font-semibold">{record.student?.name || '-'}</td>
                        <td className="px-5 py-3 text-xs">{record.student?.classId ? `${record.student.classId.name} ${record.student.classId.major}` : '-'}</td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
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
    </div>
  );
}
