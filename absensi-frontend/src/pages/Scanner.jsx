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
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(success, failed);

    function success(result) {
      scanner.clear();
      setScanResult(result);
      processAttendance(result);
    }

    function failed(err) {}

    return () => {
      scanner.clear().catch(error => console.error('Gagal mematikan scanner', error));
    };
  }, []);

  const processAttendance = (qrToken) => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Browser HP Anda tidak mendukung fitur GPS.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/checkin`, {
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
    <div className="min-h-screen flex flex-col font-poppins text-gray-900" style={{ background: '#F8F9FA' }}>
      
      {/* Header */}
      <header className="px-5 py-3.5 flex justify-between items-center z-20 shrink-0 text-white" style={{ background: 'linear-gradient(135deg, #5C0000, #800000)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-gold font-black text-xs">V</span>
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">VELTRIK</h1>
            <p className="text-[9px] text-white/50 uppercase tracking-wider font-medium">Scanner Presensi</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-xs font-bold text-white/70 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition"
        >
          Batal
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 p-5 flex flex-col items-center justify-start">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center shadow-sm">
          
          <div className="w-12 h-12 rounded-xl bg-maroon/10 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-maroon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zm0 9.75c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zm9.75-9.75c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Arahkan Kamera</h2>
          <p className="text-sm text-gray-400 text-center mb-6">Pindai QR Code di gerbang sekolah untuk mencatat kehadiran.</p>

          {/* Camera Scanner */}
          {!scanResult && !error && !successMsg && !isLoading && (
            <div className="w-full overflow-hidden rounded-xl border-2 border-dashed border-maroon/20">
              <div id="reader" className="w-full"></div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-12 w-full rounded-xl bg-gray-50 border border-gray-100">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-maroon mx-auto mb-4"></div>
              <p className="text-sm font-semibold text-maroon">Memvalidasi Koordinat GPS...</p>
              <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar</p>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="w-full bg-status-hadir/10 border border-status-hadir/20 p-6 rounded-xl text-center mt-2 animate-bounce-in">
              <div className="w-14 h-14 rounded-full bg-status-hadir/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-status-hadir" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
              <h2 className="text-base font-bold text-status-hadir mb-1">Absensi Berhasil!</h2>
              <p className="text-gray-600 text-sm mb-6">{successMsg}</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full bg-maroon text-white py-3 rounded-xl text-sm font-bold hover:bg-maroon-dark transition"
              >
                Kembali ke Dashboard
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="w-full bg-status-alpa/10 border border-status-alpa/20 p-6 rounded-xl text-center mt-2 animate-bounce-in">
              <div className="w-14 h-14 rounded-full bg-status-alpa/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-status-alpa" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              </div>
              <h2 className="text-base font-bold text-status-alpa mb-1">Absensi Ditolak</h2>
              <p className="text-gray-600 text-sm mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-white text-gray-900 border border-gray-200 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
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