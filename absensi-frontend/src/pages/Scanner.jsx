import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Inisialisasi Scanner Kamera
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(success, failed);

    function success(result) {
      scanner.clear(); // Matikan kamera setelah berhasil scan
      setScanResult(result);
      processAttendance(result);
    }

    function failed(err) {
      // Mengabaikan pesan error bawaan saat kamera sedang mencari QR
    }

    // Mematikan kamera secara aman saat pengguna keluar dari halaman
    return () => {
      scanner.clear().catch(error => console.error('Gagal mematikan scanner', error));
    };
  }, []);

  const processAttendance = (qrToken) => {
    setIsLoading(true);
    setError('');

    // 1. Cek apakah HP mendukung fitur GPS Lokasi
    if (!navigator.geolocation) {
      setError('Browser HP Anda tidak mendukung fitur GPS.');
      setIsLoading(false);
      return;
    }

    // 2. Ambil titik koordinat GPS Siswa
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // 3. Kirim data QR dan Lokasi ke Backend
        try {
          const response = await axios.post('http://localhost:5000/api/attendance/checkin', {
            qrToken: qrToken,
            lat: latitude,
            lng: longitude
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });

          setSuccessMsg(response.data.message);
        } catch (err) {
          setError(err.response?.data?.message || 'Gagal melakukan absensi');
        } finally {
          setIsLoading(false);
        }
      },
      (geoError) => {
        setError('Gagal mengambil lokasi GPS. Pastikan izin lokasi (Location) di HP Anda diaktifkan.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true } 
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      
      {/* Header Mobile Flat UI */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-[#183057] leading-tight">SMK Widya Utama</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Scanner Presensi</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition"
        >
          Batal
        </button>
      </header>

      {/* Area Konten Utama */}
      <main className="flex-1 p-6 flex flex-col items-center justify-start">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center">
          
          <h2 className="text-lg font-bold text-gray-900 mb-2">Arahkan Kamera</h2>
          <p className="text-sm text-gray-500 text-center mb-6">Pindai QR Code di gerbang sekolah untuk mencatat kehadiran Anda.</p>

          {/* Area Kamera Scanner */}
          {!scanResult && !error && !successMsg && !isLoading && (
            <div className="w-full overflow-hidden rounded-md border border-gray-200">
              <div id="reader" className="w-full"></div>
            </div>
          )}

          {/* Status: Sedang Memproses */}
          {isLoading && (
            <div className="text-center py-10 w-full border border-gray-200 rounded-md bg-gray-50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#183057] mx-auto mb-4"></div>
              <p className="text-sm font-semibold text-[#183057]">Memvalidasi Koordinat GPS...</p>
            </div>
          )}

          {/* Status: Berhasil */}
          {successMsg && (
            <div className="w-full bg-green-50 border border-green-200 p-6 rounded-md text-center mt-2">
              <h2 className="text-base font-bold text-green-800 mb-2">Absensi Berhasil</h2>
              <p className="text-green-700 text-sm mb-6">{successMsg}</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[#183057] text-white py-2.5 rounded-md text-sm font-semibold hover:bg-[#112240] transition"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )}

          {/* Status: Gagal/Ditolak */}
          {error && (
            <div className="w-full bg-red-50 border border-red-200 p-6 rounded-md text-center mt-2">
              <h2 className="text-base font-bold text-red-800 mb-2">Absensi Ditolak</h2>
              <p className="text-red-700 text-sm mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-white text-gray-900 border border-gray-300 py-2.5 rounded-md text-sm font-semibold hover:bg-gray-50 transition"
              >
                Coba Scan Lagi
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}