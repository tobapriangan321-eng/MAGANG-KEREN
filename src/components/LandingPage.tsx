import { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Code2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Megaphone,
  Palette,
  Scale,
  Search,
} from 'lucide-react';
import { INTERNSHIP_CATEGORIES } from '../types';
import type { Internship, PlatformStats, WorkSystem } from '../types';
import { InternshipCard } from './InternshipCard';

interface LandingPageProps {
  internships: Internship[];
  stats: PlatformStats;
  savedIds: Set<number>;
  onSearchSubmit: (filters: {
    q?: string;
    location?: string;
    work_system?: WorkSystem | 'Semua';
    category?: string;
  }) => void;
  onSelectInternship: (internship: Internship) => void;
  onToggleSave: (internshipId: number) => void;
  onNavigateExplore: () => void;
}

const CATEGORY_ICONS: Record<string, typeof Code2> = {
  'Teknologi dan IT': Code2,
  'Bisnis dan Manajemen': Briefcase,
  'Keuangan dan Akuntansi': Landmark,
  'Desain dan Kreatif': Palette,
  Pendidikan: GraduationCap,
  'Komunikasi dan Media': Megaphone,
  Hukum: Scale,
  Kesehatan: HeartPulse,
};

export function LandingPage({
  internships,
  stats,
  savedIds,
  onSearchSubmit,
  onSelectInternship,
  onToggleSave,
  onNavigateExplore,
}: LandingPageProps) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [workSystem, setWorkSystem] = useState<WorkSystem | 'Semua'>('Semua');
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [aboutImgFailed, setAboutImgFailed] = useState(false);

  const recommended = internships.slice(0, 6);

  const categoryCounts = INTERNSHIP_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = internships.filter((item) => item.category === cat).length;
    return acc;
  }, {});

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit({
      q: keyword,
      location: location || 'Semua',
      work_system: workSystem,
    });
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-14 sm:px-6 lg:px-8 lg:pt-16 lg:pb-18">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Copy Column */}
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-xs font-semibold tracking-wide text-sky-600">
                Platform Magang &amp; Karier Indonesia
              </p>
              <h1
                className="mt-3 font-display font-extrabold tracking-tight text-slate-900 leading-[1.12]"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.35rem)',
                  textWrap: 'balance',
                }}
              >
                Mulai Perjalanan Kariermu dari Sini.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                Temukan peluang magang terkurasi untuk siswa SMA/SMK, mahasiswa, dan fresh graduate. Bangun pengalaman kerja nyata bersama perusahaan terpercaya di berbagai sektor industri.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onNavigateExplore}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                >
                  <span>Temukan Magang</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href="#tentang-kami"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  Pelajari Lebih Lanjut
                </a>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[260px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_magang_workspace_1795414698997.jpg"
                    alt="Suasana kerja kolaboratif peserta magang dan mentor di ruang kerja modern"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="h-full w-full object-cover aspect-video lg:aspect-auto"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-center text-white">
                    <Building2 className="h-10 w-10 text-sky-400" />
                    <p className="mt-3 font-display text-lg font-semibold">
                      MAGANG KEREN
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Temukan Peluang, Bangun Pengalaman, Wujudkan Masa Depan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar Row */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-10 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs"
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <div className="relative md:col-span-5">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Cari posisi magang atau nama perusahaan..."
                  aria-label="Cari posisi magang atau nama perusahaan"
                  className="h-11 w-full rounded-lg border border-transparent bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label="Pilih lokasi magang"
                  className="h-11 w-full rounded-lg border border-transparent bg-slate-50 px-3.5 text-sm text-slate-700 focus:border-sky-400 focus:bg-white focus:outline-none"
                >
                  <option value="">Semua Lokasi</option>
                  <option value="Jakarta">Jakarta</option>
                  <option value="Bandung">Bandung</option>
                  <option value="Surabaya">Surabaya</option>
                  <option value="Yogyakarta">Yogyakarta</option>
                  <option value="Tangerang">Tangerang Selatan</option>
                  <option value="Remote">Remote / Seluruh Indonesia</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={workSystem}
                  onChange={(e) => setWorkSystem(e.target.value as WorkSystem | 'Semua')}
                  aria-label="Pilih sistem kerja"
                  className="h-11 w-full rounded-lg border border-transparent bg-slate-50 px-3.5 text-sm text-slate-700 focus:border-sky-400 focus:bg-white focus:outline-none"
                >
                  <option value="Semua">Semua Sistem</option>
                  <option value="WFO">WFO</option>
                  <option value="WFH">WFH</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="h-11 w-full cursor-pointer rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap"
                >
                  Cari Lowongan
                </button>
              </div>
            </div>
          </form>

          {/* 4-Column Platform Statistics Strip */}
          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-slate-200 pt-8 md:grid-cols-4">
            <div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
                {stats.total_companies}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Perusahaan Mitra Terverifikasi
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
                {stats.total_internships}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Lowongan Magang Aktif
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
                {stats.total_users}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Peserta &amp; Pencari Magang
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums sm:text-3xl">
                {stats.total_applications}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Lamaran Terkirim via Platform
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kategori Bidang Magang */}
      <section id="kategori-bidang" className="border-b border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Kategori Bidang Magang
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Pilih bidang keahlian yang sesuai dengan latar belakang pendidikan dan minat kariermu.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateExplore}
              className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 whitespace-nowrap shrink-0"
            >
              <span>Jelajahi Semua Bidang</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INTERNSHIP_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category] || Briefcase;
              const count = categoryCounts[category] ?? 0;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSearchSubmit({ category })}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left transition-all duration-150 hover:border-sky-300 hover:bg-sky-50/30 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-sky-600 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-display text-sm font-semibold text-slate-900">
                        {category}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {count} lowongan aktif
                      </div>
                    </div>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-sky-600"
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Rekomendasi Lowongan Magang Terbaru */}
      <section className="border-b border-slate-200 bg-slate-50/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Rekomendasi Lowongan Terbaru
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Posisi magang pilihan dengan bimbingan terstruktur untuk SMA/SMK, mahasiswa, dan fresh graduate.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateExplore}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:border-sky-300 hover:text-sky-700 whitespace-nowrap shrink-0"
            >
              Lihat Semua Lowongan
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recommended.map((item) => (
              <InternshipCard
                key={item.id}
                internship={item}
                isSaved={savedIds.has(item.id)}
                onSelect={onSelectInternship}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Tentang Kami Section */}
      <section id="tentang-kami" className="bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                {!aboutImgFailed ? (
                  <img
                    src="/src/assets/images/about_career_mentoring_1795414700036.jpg"
                    alt="Mentor membimbing peserta magang dalam diskusi karier dan proyek"
                    referrerPolicy="no-referrer"
                    onError={() => setAboutImgFailed(true)}
                    className="h-full w-full object-cover aspect-[4/3] lg:aspect-auto"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center bg-slate-900 p-8 text-center text-white">
                    <p className="font-display text-lg font-semibold">
                      Pendampingan Karier Terstruktur
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-7">
              <p className="text-xs font-semibold tracking-wide text-sky-600">
                Tentang MAGANG KEREN
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Temukan Peluang, Bangun Pengalaman, Wujudkan Masa Depan.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Kami merancang pengalaman pencarian dan pendaftaran magang yang transparan, terstruktur, dan mudah diakses bagi siswa SMA/SMK (PKL), mahasiswa aktif, maupun lulusan baru di seluruh Indonesia.
              </p>

              <div className="mt-8 space-y-6 border-t border-slate-200 pt-6">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    01. Lengkapi Profil &amp; Unggah CV Sekali Saja
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Cantumkan jenjang pendidikan, keahlian, bidang minat, dan unggah CV terbaru Anda untuk mempercepat proses pendaftaran ke berbagai perusahaan.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    02. Filter Presisi Sesuai Kebutuhan Pendidikan
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Saring lowongan berdasarkan jenjang SMA/SMK, Mahasiswa, atau Fresh Graduate, serta pilih sistem kerja WFO, WFH, atau Hybrid sesuai ketersediaan Anda.
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    03. Pantau Status Lamaran Secara Transparan
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Setiap lamaran memiliki kode referensi unik dan pembaruan status langsung dari tim rekrutmen: Menunggu Review, Sedang Diproses, Diterima, atau Ditolak.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
