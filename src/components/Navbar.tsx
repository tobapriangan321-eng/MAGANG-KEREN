import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { UserProfile } from '../types';

export type PageView = 'home' | 'explore' | 'dashboard' | 'admin';

interface NavbarProps {
  currentPage: PageView;
  user: UserProfile | null;
  onNavigate: (page: PageView, sectionId?: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentPage,
  user,
  onNavigate,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLink = (page: PageView, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(page, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleLink('home')}
          className="font-display text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500"
        >
          MAGANG KEREN
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <button
            type="button"
            onClick={() => handleLink('home')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentPage === 'home' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Beranda
          </button>
          <button
            type="button"
            onClick={() => handleLink('explore')}
            className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentPage === 'explore' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Cari Magang
          </button>
          <button
            type="button"
            onClick={() => handleLink('home', 'tentang-kami')}
            className="cursor-pointer whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
          >
            Tentang Kami
          </button>
          {user && user.role !== 'admin' && (
            <button
              type="button"
              onClick={() => handleLink('dashboard')}
              className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                currentPage === 'dashboard' ? 'text-sky-600 font-semibold' : ''
              }`}
            >
              Dashboard
            </button>
          )}
          {user && user.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleLink('admin')}
              className={`cursor-pointer whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
                currentPage === 'admin' ? 'text-sky-600 font-semibold' : ''
              }`}
            >
              Admin Panel
            </button>
          )}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {!user ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="hidden md:inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Masuk
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleLink(user.role === 'admin' ? 'admin' : 'dashboard')}
              className="hidden md:inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-900 transition-colors hover:border-sky-300 hover:bg-sky-50/50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              <span className="max-w-[140px] truncate">{user.name.split(' ')[0]}</span>
              <span aria-hidden="true" className="text-slate-300">
                /
              </span>
              <span className="text-sky-600">
                {user.role === 'admin' ? 'Admin' : 'Akun Saya'}
              </span>
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => handleLink('home')}
              className="text-left py-2 hover:text-slate-900"
            >
              Beranda
            </button>
            <button
              type="button"
              onClick={() => handleLink('explore')}
              className="text-left py-2 hover:text-slate-900"
            >
              Cari Magang
            </button>
            <button
              type="button"
              onClick={() => handleLink('home', 'tentang-kami')}
              className="text-left py-2 hover:text-slate-900"
            >
              Tentang Kami
            </button>
            {user && (
              <button
                type="button"
                onClick={() => handleLink(user.role === 'admin' ? 'admin' : 'dashboard')}
                className="text-left py-2 text-sky-600 font-semibold"
              >
                {user.role === 'admin' ? 'Admin Panel' : 'Dashboard Saya'}
              </button>
            )}
            <div className="pt-2 border-t border-slate-100">
              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onOpenAuth();
                  }}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Masuk / Daftar Akun
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700"
                >
                  Keluar ({user.name.split(' ')[0]})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
