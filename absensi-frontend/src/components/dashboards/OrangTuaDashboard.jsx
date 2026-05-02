export default function OrangTuaDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-8 rounded-lg text-center">
        <h2 className="text-xl font-bold text-[#183057] mb-2">Portal Orang Tua / Wali Murid</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">Pantau kehadiran putra-putri Anda dengan mudah dan *realtime*.</p>
        
        <div className="bg-gray-50 border border-dashed border-gray-300 h-48 rounded-lg flex items-center justify-center flex-col">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Data Kehadiran Anak</p>
          <span className="text-xs text-gray-400 px-8 text-center">(Modul Pemantauan Anak akan dikembangkan pada Fase 15 - Manajemen Orang Tua)</span>
        </div>
      </div>
    </div>
  );
}
