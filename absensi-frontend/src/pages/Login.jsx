import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'Nama Sekolah';
  const appBrand = import.meta.env.VITE_APP_BRAND || 'Sistem Absensi Digital';

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Mengirim request ke Backend kita
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      // Simpan token dan data user ke LocalStorage
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data));

      // Arahkan ke halaman Dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8">
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo.png" alt="Logo SMK Widya Utama" className="h-16 w-16 mb-4 object-contain" />
          <h1 className="text-2xl font-extrabold text-[#183057] mb-1 tracking-tight">
            SMK Widya Utama
          </h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">{appBrand}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 p-3 mb-6 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-200 focus:border-[#183057] outline-none bg-gray-50 text-sm transition-colors"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 focus:border-[#183057] outline-none bg-gray-50 text-sm transition-colors"
              placeholder="Masukkan password Anda"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#183057] text-white py-3 font-bold text-sm hover:bg-[#112240] transition-colors disabled:opacity-50 mt-4"
          >
            {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}