import { useState } from 'react';
import { Loader2, ShieldCheck, UserCheck, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { EducationLevel, UserProfile } from '../types';

interface AuthModalProps {
  open: boolean;
  promptMessage?: string;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserProfile) => void;
}

export function AuthModal({
  open,
  promptMessage,
  onClose,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('Mahasiswa');
  const [institution, setInstitution] = useState('');
  const [major, setMajor] = useState('');
  const [city, setCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submitLogin = async (loginEmail: string, loginPassword: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk ke akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await submitLogin(email, password);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          education_level: educationLevel,
          institution,
          major,
          city,
        }),
      });
      onAuthSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="auth-modal-title" className="font-display text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Masuk ke MAGANG KEREN' : 'Buat Akun Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Akses dashboard, lamaran, dan profil kariermu.'
                : 'Daftar gratis untuk siswa SMA/SMK, mahasiswa, dan fresh graduate.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela akun"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`cursor-pointer rounded-md py-1.5 text-xs font-semibold transition-colors ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`cursor-pointer rounded-md py-1.5 text-xs font-semibold transition-colors ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Daftar Akun
            </button>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-3.5">
          {promptMessage && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800">
              {promptMessage}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Nadia Putri Maharani"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">Email *</label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Kata Sandi *</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Jenjang Pendidikan
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm focus:border-sky-500 focus:outline-none"
                  >
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Fresh Graduate">Fresh Graduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kota Domisili</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jakarta"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Sekolah / Perguruan Tinggi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Universitas Indonesia / SMKN 26 Jakarta"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Jurusan / Program Studi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Teknik Informatika / RPL"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{mode === 'login' ? 'Masuk Sekarang' : 'Buat Akun'}</span>
          </button>

          {mode === 'login' && (
            <div className="border-t border-slate-200 pt-4">
              <p className="text-[11px] font-medium text-slate-500">
                Akses Cepat Akun Demo:
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => submitLogin('nadia.putri@mahasiswa.id', 'magang123')}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
                >
                  <UserCheck className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                  <span>Peserta Demo</span>
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => submitLogin('admin@magangkeren.id', 'admin123')}
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-800" aria-hidden="true" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
