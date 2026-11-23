import { useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { INTERNSHIP_CATEGORIES } from '../types';
import type { EducationLevel, Internship, WorkSystem } from '../types';
import { InternshipCard } from './InternshipCard';

export interface ExploreFilters {
  q: string;
  company: string;
  category: string;
  location: string;
  work_system: WorkSystem | 'Semua';
  duration: string;
  education_level: EducationLevel | 'Semua';
}

interface ExplorePageProps {
  internships: Internship[];
  filters: ExploreFilters;
  savedIds: Set<number>;
  onFiltersChange: (next: ExploreFilters) => void;
  onSelectInternship: (internship: Internship) => void;
  onToggleSave: (internshipId: number) => void;
}

export const DEFAULT_FILTERS: ExploreFilters = {
  q: '',
  company: '',
  category: 'Semua',
  location: 'Semua',
  work_system: 'Semua',
  duration: 'Semua',
  education_level: 'Semua',
};

export function ExplorePage({
  internships,
  filters,
  savedIds,
  onFiltersChange,
  onSelectInternship,
  onToggleSave,
}: ExplorePageProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const uniqueCompanies = useMemo(
    () => Array.from(new Set(internships.map((i) => i.company_name))).sort(),
    [internships]
  );

  const uniqueLocations = useMemo(
    () => Array.from(new Set(internships.map((i) => i.location))).sort(),
    [internships]
  );

  const filtered = useMemo(() => {
    return internships.filter((item) => {
      if (filters.q.trim()) {
        const term = filters.q.trim().toLowerCase();
        const matchText =
          item.title.toLowerCase().includes(term) ||
          item.company_name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term);
        if (!matchText) return false;
      }

      if (filters.company && filters.company !== 'Semua') {
        if (!item.company_name.toLowerCase().includes(filters.company.toLowerCase())) {
          return false;
        }
      }

      if (filters.category !== 'Semua' && item.category !== filters.category) {
        return false;
      }

      if (filters.location !== 'Semua') {
        if (!item.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      if (filters.work_system !== 'Semua' && item.work_system !== filters.work_system) {
        return false;
      }

      if (filters.education_level !== 'Semua' && item.education_level !== filters.education_level) {
        return false;
      }

      if (filters.duration !== 'Semua') {
        if (filters.duration === '1-3 Bulan' && !(item.duration_months >= 1 && item.duration_months <= 3)) {
          return false;
        }
        if (filters.duration === '4-6 Bulan' && !(item.duration_months >= 4 && item.duration_months <= 6)) {
          return false;
        }
        if (filters.duration === '> 6 Bulan' && !(item.duration_months > 6)) {
          return false;
        }
      }

      return true;
    });
  }, [internships, filters]);

  const hasActiveFilters =
    filters.q !== '' ||
    filters.company !== '' ||
    filters.category !== 'Semua' ||
    filters.location !== 'Semua' ||
    filters.work_system !== 'Semua' ||
    filters.duration !== 'Semua' ||
    filters.education_level !== 'Semua';

  const updateField = <K extends keyof ExploreFilters>(key: K, value: ExploreFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="min-h-[75vh] bg-slate-50/50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Cari Lowongan Magang
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Temukan program magang dan PKL yang sesuai dengan posisi, lokasi, sistem kerja, durasi, dan jenjang pendidikanmu.
          </p>

          {/* Search Inputs Row */}
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-6">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                value={filters.q}
                onChange={(e) => updateField('q', e.target.value)}
                placeholder="Cari nama posisi magang (contoh: Frontend, Akuntansi, UI/UX)..."
                aria-label="Cari nama posisi magang"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={filters.company || 'Semua'}
                onChange={(e) =>
                  updateField('company', e.target.value === 'Semua' ? '' : e.target.value)
                }
                aria-label="Filter nama perusahaan"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                <option value="Semua">Semua Perusahaan</option>
                {uniqueCompanies.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filter</span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                  className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workspace Layout: Filter Sidebar + Results Grid */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Filters Panel */}
          <aside
            className={`lg:col-span-3 space-y-6 ${
              showMobileFilters ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
              {/* Sistem Kerja Segmented Control */}
              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Sistem Kerja
                </label>
                <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-100 p-1">
                  {(['Semua', 'WFO', 'WFH', 'Hybrid'] as const).map((sys) => (
                    <button
                      key={sys}
                      type="button"
                      onClick={() => updateField('work_system', sys)}
                      className={`cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        filters.work_system === sys
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sys}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bidang Industri */}
              <div>
                <label
                  htmlFor="filter-category"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Bidang Industri
                </label>
                <select
                  id="filter-category"
                  value={filters.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Semua">Semua Bidang</option>
                  {INTERNSHIP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lokasi Magang */}
              <div>
                <label
                  htmlFor="filter-location"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Lokasi Magang
                </label>
                <select
                  id="filter-location"
                  value={filters.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Semua">Semua Lokasi</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Durasi Magang */}
              <div>
                <label
                  htmlFor="filter-duration"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Durasi Program
                </label>
                <select
                  id="filter-duration"
                  value={filters.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                >
                  <option value="Semua">Semua Durasi</option>
                  <option value="1-3 Bulan">1 – 3 Bulan</option>
                  <option value="4-6 Bulan">4 – 6 Bulan</option>
                  <option value="> 6 Bulan">&gt; 6 Bulan</option>
                </select>
              </div>

              {/* Jenjang Pendidikan */}
              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Jenjang Pendidikan
                </label>
                <div className="mt-2 space-y-1.5">
                  {(['Semua', 'SMA/SMK', 'Mahasiswa', 'Fresh Graduate'] as const).map(
                    (edu) => (
                      <button
                        key={edu}
                        type="button"
                        onClick={() => updateField('education_level', edu)}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          filters.education_level === edu
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <span>{edu}</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Results Grid */}
          <div className="lg:col-span-9">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Menampilkan{' '}
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {filtered.length}
                </span>{' '}
                lowongan magang tersedia
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
                <h3 className="font-display text-base font-semibold text-slate-900">
                  Tidak ada lowongan yang sesuai
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Coba ubah kata kunci pencarian atau atur ulang beberapa filter yang aktif.
                </p>
                <button
                  type="button"
                  onClick={() => onFiltersChange(DEFAULT_FILTERS)}
                  className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reset Semua Filter</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filtered.map((item) => (
                  <InternshipCard
                    key={item.id}
                    internship={item}
                    isSaved={savedIds.has(item.id)}
                    onSelect={onSelectInternship}
                    onToggleSave={onToggleSave}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
