import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-poppins">
      
      {/* ===== PANEL KIRI — BRANDING (Desktop Only) ===== */}
      <div className="hidden lg:flex lg:w-[58%] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5C0000 0%, #800000 50%, #A52A2A 100%)' }}>
        
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }}></div>
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #F5A623 0%, transparent 70%)' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-white/5"></div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-16 animate-fade-in">
          
          {/* School Logo */}
          <div className="w-28 h-28 mb-8 relative">
            <img src="/logo.png" alt="Logo SMK Widya Utama" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>

          {/* Brand Name */}
          <h1 className="text-5xl font-black text-white tracking-wider mb-2" style={{ letterSpacing: '0.15em' }}>
            VELTRIK
          </h1>
          <div className="w-16 h-1 bg-gold rounded-full mb-4"></div>
          <p className="text-white/70 text-sm font-medium tracking-wide text-center max-w-xs">
            Sistem Absensi Digital Modern
          </p>
          <p className="text-gold/80 text-xs font-semibold tracking-widest uppercase mt-1">
            SMK Widya Utama
          </p>

          {/* Feature Pills */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {['QR Scan', 'Real-time', 'Multi-Role', 'Laporan'].map((f, i) => (
              <span key={i} className="px-4 py-1.5 rounded-full border border-white/20 text-white/60 text-xs font-medium tracking-wide">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ===== PANEL KANAN — FORM LOGIN ===== */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white relative">
        
        {/* Mobile Header (hanya tampil di HP) */}
        <div className="lg:hidden mb-10 text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4">
            <img src="/logo.png" alt="Logo SMK Widya Utama" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-maroon tracking-wider">VELTRIK</h1>
          <p className="text-gray-400 text-xs font-medium mt-1">Absensi Digital SMK Widya Utama</p>
        </div>

        <div className="w-full max-w-sm animate-slide-up">
          
          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Selamat Datang 👋</h2>
            <p className="text-gray-400 text-sm">Masuk ke akun Anda untuk melanjutkan</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-bounce-in">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all"
                  placeholder="nama@smkwidyautama.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-maroon/20 hover:shadow-xl hover:shadow-maroon/30 hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #800000, #5C0000)' }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memproses...</span>
                </>
              ) : (
                'Masuk Sekarang'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-[11px] text-gray-400 font-medium text-center">
          © 2025 SMK Widya Utama. Powered by <span className="font-bold text-maroon">Veltrik</span>
        </p>
      </div>
    </div>
  );
}