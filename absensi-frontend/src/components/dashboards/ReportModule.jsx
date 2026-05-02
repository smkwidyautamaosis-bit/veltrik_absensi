import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportModule() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role;
  const isWaliKelas = role === 'wali_kelas';

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(isWaliKelas ? user.classId || '' : '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Jika bukan wali kelas, ambil daftar semua kelas untuk filter
    if (!isWaliKelas) {
      axios.get('http://localhost:5000/api/classes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setClasses(res.data.data))
      .catch(err => console.error('Error fetching classes', err));
    }
  }, [isWaliKelas, token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (new Date(endDate) < new Date(startDate)) {
      return alert('Tanggal Akhir tidak boleh lebih kecil dari Tanggal Mulai!');
    }

    setIsLoading(true);
    try {
      let url = `http://localhost:5000/api/attendance/report?startDate=${startDate}&endDate=${endDate}`;
      if (selectedClass) {
        url += `&classId=${selectedClass}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'hadir': return 'text-green-600 bg-green-50';
      case 'telat': return 'text-yellow-600 bg-yellow-50';
      case 'izin': return 'text-blue-600 bg-blue-50';
      case 'sakit': return 'text-orange-600 bg-orange-50';
      case 'alfa': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
      if (statKey === 'Alfa') stats[studentName].Alpa += 1;
      else if (stats[studentName][statKey] !== undefined) stats[studentName][statKey] += 1;
    });
    return stats;
  };

  const exportExcel = () => {
    if (reportData.length === 0) return alert('Tidak ada data untuk diexport');

    const wb = XLSX.utils.book_new();

    // Sheet 1: Data Lengkap
    const wsData = reportData.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.date,
      'Nama Siswa': item.student?.name,
      'Kelas': item.student?.classId?.name,
      'Waktu Scan': new Date(item.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      'Status': item.status.toUpperCase()
    }));
    const ws1 = XLSX.utils.json_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws1, "Data Lengkap");

    // Sheet 2: Ringkasan
    const stats = calculateStats(reportData);
    const summaryData = Object.keys(stats).map((name, index) => ({
      'No': index + 1,
      'Nama Siswa': name,
      'Hadir': stats[name].Hadir,
      'Telat': stats[name].Telat,
      'Izin': stats[name].Izin,
      'Sakit': stats[name].Sakit,
      'Alpa': stats[name].Alpa
    }));
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan Statistik");

    XLSX.writeFile(wb, `Laporan_Absensi_${startDate}_to_${endDate}.xlsx`);
  };

  const exportPDF = () => {
    if (reportData.length === 0) return alert('Tidak ada data untuk diexport');
    
    const doc = new jsPDF();
    
    // Kop Surat
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SMK WIDYA UTAMA", 105, 15, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Rekapitulasi Kehadiran Siswa", 105, 22, { align: 'center' });
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 105, 28, { align: 'center' });
    doc.line(14, 32, 196, 32);

    // Tabel Data
    const tableColumn = ["No", "Tanggal", "Nama Siswa", "Kelas", "Waktu", "Status"];
    const tableRows = [];

    reportData.forEach((item, index) => {
      tableRows.push([
        index + 1,
        item.date,
        item.student?.name || '-',
        item.student?.classId?.name || '-',
        new Date(item.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        item.status.toUpperCase()
      ]);
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
    
    doc.setFontSize(10);
    doc.text(`Dicetak tanggal: ${today}`, 14, finalY + 15);
    doc.text("Mengetahui,", 140, finalY + 15);
    doc.text(user.name || "Wali Kelas / Pimpinan", 140, finalY + 40);
    doc.line(140, finalY + 41, 190, finalY + 41);

    doc.save(`Laporan_Absensi_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Filter Laporan</h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Dari Tanggal</label>
            <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#183057]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sampai Tanggal</label>
            <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-[#183057]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Pilih Kelas</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)} 
              disabled={isWaliKelas}
              className={`w-full text-sm border border-gray-200 rounded px-3 py-2 outline-none ${isWaliKelas ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:border-[#183057]'}`}
            >
              {isWaliKelas ? (
                <option value={user.classId || ''}>Kelas Saya</option>
              ) : (
                <>
                  <option value="">-- Semua Kelas --</option>
                  {classes.map(c => (
                    <option key={c._id} value={c._id}>{c.name} - {c.major}</option>
                  ))}
                </>
              )}
            </select>
          </div>
          <button type="submit" disabled={isLoading} className="bg-[#183057] text-white py-2 rounded text-sm font-bold hover:bg-[#112240] transition disabled:opacity-50 h-[38px]">
            {isLoading ? 'Mencari...' : 'Tarik Data'}
          </button>
        </form>
      </div>

      {/* Result Section */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pratinjau Data Laporan</h2>
          <div className="flex gap-2">
            <button onClick={exportExcel} disabled={reportData.length === 0} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition disabled:opacity-50">
              Export Excel
            </button>
            <button onClick={exportPDF} disabled={reportData.length === 0} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition disabled:opacity-50">
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Siswa</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Kelas</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.length > 0 ? (
                reportData.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-xs font-medium">{item.date}</td>
                    <td className="px-6 py-3 text-xs">{item.student?.name}</td>
                    <td className="px-6 py-3 text-xs">{item.student?.classId?.name || '-'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">Pilih rentang tanggal lalu klik Tarik Data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
