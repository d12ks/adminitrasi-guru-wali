import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { gasService } from '../services/gasService';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isLoading, setLoading } = useApp();
  const [email, setEmail] = useState('');
  const [splash, setSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
        // Attempt connection using hardcoded URL in gasService
        await gasService.loginAndClone(email); 
        await login(email);
    } catch (err) {
        alert("Gagal terhubung! Pastikan koneksi internet lancar.\n\nError: " + err);
    } finally {
        setLoading(false);
    }
  };

  if (splash) {
    return (
      <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center text-white z-50">
        <div className="animate-bounce mb-4">
            <GraduationCap size={80} />
        </div>
        <h1 className="text-3xl font-bold tracking-wider animate-pulse">GURU WALI</h1>
        <p className="mt-2 text-primary-200">SMK NEGERI 1 MONDOKAN</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark p-4">
      <div className="bg-white dark:bg-paperDark p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
            <div className="inline-flex p-4 bg-primary/10 rounded-full text-primary mb-4">
                <GraduationCap size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">GURU WALI</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Administrasi & Pelaporan</p>
            <p className="text-gray-500 dark:text-gray-400 mt-2"> Murid Dampingan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Guru</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="nama@email.com"
            />
            <p className="text-[10px] text-gray-400 mt-2 ml-1">
                *Pastikan email aktif untuk sinkronisasi data.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/30 mt-4"
          >
            {isLoading ? (
                <>
                <Loader2 className="animate-spin" size={20} />
                <span>Menghubungkan...</span>
                </>
            ) : (
                <>
                Masuk <ArrowRight size={20} />
                </>
            )}
          </button>
        </form>
         <p className="text-xs text-center text-gray-400 mt-6">
            Guru Wali | @2025 by d12ks
        </p>
      </div>
    </div>
  );
};

export default Login;