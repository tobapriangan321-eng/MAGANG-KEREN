import { Mail, MapPin, Phone } from 'lucide-react';
import type { PageView } from './Navbar';

interface FooterProps {
  onNavigate: (page: PageView, sectionId?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5 space-y-3">
            <div className="font-display text-lg font-extrabold tracking-tight text-white">
              MAGANG KEREN
            </div>
            <p className="text-sm leading-relaxed text-slate-300 max-w-sm">
              Temukan Peluang, Bangun Pengalaman, Wujudkan Masa Depan. Platform terkurasi yang menghubungkan siswa SMA/SMK, mahasiswa, dan fresh graduate dengan perusahaan terpercaya di Indonesia.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400">
              Navigasi
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="cursor-pointer text-slate-300 transition-colors hover:text-white"
                >
                  Beranda
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('explore')}
                  className="cursor-pointer text-slate-300 transition-colors hover:text-white"
                >
                  Cari Lowongan Magang
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home', 'kategori-bidang')}
                  className="cursor-pointer text-slate-300 transition-colors hover:text-white"
                >
                  Kategori Bidang
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home', 'tentang-kami')}
                  className="cursor-pointer text-slate-300 transition-colors hover:text-white"
                >
                  Tentang Kami
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400">
              Kontak Platform
            </h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                <span>halo@magangkeren.id</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                <span className="tabular-nums">+62 21 5098 4400</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                <span>Kawasan SCBD, Kebayoran Baru, Jakarta Selatan</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} MAGANG KEREN. Seluruh hak cipta dilindungi.</p>
          <p>Dirancang untuk talenta muda SMA/SMK, Mahasiswa, dan Fresh Graduate Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
