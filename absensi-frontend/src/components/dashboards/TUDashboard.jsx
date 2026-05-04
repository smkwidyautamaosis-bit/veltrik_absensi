import { useNavigate } from 'react-router-dom';

export default function TUDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 p-8 rounded-lg text-center">
        <h2 className="text-xl font-bold text-maroon mb-2">Pusat Administrasi Tata Usaha</h2>
        <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto">Kelola data master sekolah secara efisien. Gunakan jalan pintas di bawah ini untuk menghemat waktu Anda.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => navigate('/students')} className="p-6 bg-gray-50 border border-gray-200 rounded-md hover:bg-maroon hover:text-white transition-colors group">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-900 group-hover:text-white">Data Siswa</h3>
            <p className="text-xs text-gray-500 group-hover:text-gray-300">Kelola master data siswa</p>
          </button>
          <button onClick={() => navigate('/teachers')} className="p-6 bg-gray-50 border border-gray-200 rounded-md hover:bg-maroon hover:text-white transition-colors group">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-900 group-hover:text-white">Data Guru</h3>
            <p className="text-xs text-gray-500 group-hover:text-gray-300">Kelola master data pendidik</p>
          </button>
          <button onClick={() => navigate('/classes')} className="p-6 bg-gray-50 border border-gray-200 rounded-md hover:bg-maroon hover:text-white transition-colors group">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-1 text-gray-900 group-hover:text-white">Data Kelas</h3>
            <p className="text-xs text-gray-500 group-hover:text-gray-300">Kelola rombongan belajar</p>
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
        <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-2">Pengingat Kalender Akademik</h3>
        <p className="text-xs text-yellow-700">Pastikan untuk selalu memperbarui hari libur nasional dan semester agar perhitungan otomatis kehadiran (Alpa) berjalan akurat.</p>
        <button onClick={() => navigate('/holidays')} className="mt-4 px-4 py-2 bg-yellow-600 text-white text-xs font-bold rounded hover:bg-yellow-700 transition">Kelola Kalender</button>
      </div>
    </div>
  );
}
