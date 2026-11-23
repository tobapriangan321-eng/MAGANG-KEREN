import { ArrowUpRight, Bookmark } from 'lucide-react';
import { formatIndonesianDate } from '../lib/api';
import type { Internship } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface InternshipCardProps {
  internship: Internship;
  isSaved: boolean;
  onSelect: (internship: Internship) => void;
  onToggleSave: (internshipId: number) => void;
}

export function InternshipCard({
  internship,
  isSaved,
  onSelect,
  onToggleSave,
}: InternshipCardProps) {
  return (
    <article
      onClick={() => onSelect(internship)}
      className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-all duration-150 hover:border-sky-300 hover:shadow-sm cursor-pointer"
    >
      <div>
        {/* Top Row: Company Logo + Name + Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo
              code={internship.company_logo_code}
              color={internship.company_logo_color}
              name={internship.company_name}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-500">
                {internship.company_name}
              </p>
              <h3 className="mt-0.5 truncate font-display text-base font-semibold text-slate-900 group-hover:text-sky-700 transition-colors">
                {internship.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(internship.id);
            }}
            aria-label={isSaved ? 'Hapus dari lowongan tersimpan' : 'Simpan lowongan'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              isSaved
                ? 'border-sky-200 bg-sky-50 text-sky-600'
                : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-sky-600' : ''}`} />
          </button>
        </div>

        {/* Clean unboxed metadata with typographic separators (Zero-Pill Discipline) */}
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
          <span className="font-medium text-slate-800">{internship.location}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>{internship.work_system}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>{internship.duration}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span>{internship.category}</span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {internship.description}
        </p>
      </div>

      {/* Bottom Row */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="font-medium text-slate-700">{internship.education_level}</span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="tabular-nums">Tutup {formatIndonesianDate(internship.deadline)}</span>
        </div>
        <span className="inline-flex items-center gap-1 font-semibold text-sky-600 group-hover:text-sky-700 whitespace-nowrap shrink-0">
          <span>Detail</span>
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}
