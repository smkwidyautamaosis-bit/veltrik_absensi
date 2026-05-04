export default function KepalaSekolahDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-8 rounded-lg flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-maroon mb-2">Laporan Ekssekutif Sekolah</h2>
          <p className="text-sm text-gray-500">Pantau performa kehadiran seluruh siswa secara makro.</p>
        </div>
        <div className="mt-4 md:mt-0 text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Status Kehadiran Hari Ini</p>
          <p className="text-3xl font-extrabold text-green-600">92%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 border border-dashed border-gray-300 h-64 rounded-lg flex items-center justify-center flex-col">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Grafik Tren Kehadiran</p>
          <span className="text-xs text-gray-400 px-8 text-center">(Modul Grafik & Laporan akan dikembangkan pada Fase 18)</span>
        </div>
        <div className="bg-gray-50 border border-dashed border-gray-300 h-64 rounded-lg flex items-center justify-center flex-col">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Statistik Alpa Terbanyak</p>
          <span className="text-xs text-gray-400 px-8 text-center">(Modul Grafik & Laporan akan dikembangkan pada Fase 18)</span>
        </div>
      </div>
    </div>
  );
}
