import {
  Bookmark,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  MapPin,
  Wallet,
  X,
} from 'lucide-react';
import { formatIndonesianDate } from '../lib/api';
import type { Internship } from '../types';
import { CompanyLogo } from './CompanyLogo';

interface InternshipDetailModalProps {
  internship: Internship | null;
  isSaved: boolean;
  alreadyApplied: boolean;
  onClose: () => void;
  onApply: (internship: Internship) => void;
  onToggleSave: (internshipId: number) => void;
}

export function InternshipDetailModal({
  internship,
  isSaved,
  alreadyApplied,
  onClose,
  onApply,
  onToggleSave,
}: InternshipDetailModalProps) {
  if (!internship) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Bar */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-start gap-4 min-w-0">
            <CompanyLogo
              code={internship.company_logo_code}
              color={internship.company_logo_color}
              name={internship.company_name}
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                {internship.company_name} · {internship.category}
              </p>
              <h2
                id="detail-modal-title"
                className="mt-1 font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
              >
                {internship.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail lowongan"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-6 space-y-7">
          {/* Structured Key Attributes Grid */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Lokasi &amp; Sistem</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {internship.location} ({internship.work_system})
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Durasi Program</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {internship.duration}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Jenjang</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {internship.education_level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Wallet className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Kompensasi</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                {internship.stipend}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Batas Pendaftaran</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
                {formatIndonesianDate(internship.deadline)}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>Pelamar Saat Ini</span>
              </div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {internship.applicants_count ?? 0} kandidat
              </div>
            </div>
          </div>

          {/* Deskripsi Pekerjaan */}
          <section>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Deskripsi Pekerjaan
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {internship.description}
            </p>
          </section>

          {/* Tanggung Jawab */}
          <section>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Tanggung Jawab
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
              {internship.responsibilities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Kualifikasi Peserta */}
          <section>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Kualifikasi Peserta
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
              {internship.qualifications.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-sky-600"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Keuntungan yang Diperoleh */}
          <section>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Keuntungan yang Diperoleh
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
              {internship.benefits.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Persyaratan Dokumen */}
          <section>
            <h3 className="font-display text-base font-semibold text-slate-900">
              Persyaratan Dokumen
            </h3>
            <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
              {internship.document_requirements.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <FileText
                    className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Tentang Perusahaan */}
          <section className="border-t border-slate-200 pt-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Tentang {internship.company_name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {internship.company_description ||
                'Perusahaan mitra terverifikasi di platform MAGANG KEREN.'}
            </p>
            {internship.company_website && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-sky-600">
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{internship.company_website}</span>
              </div>
            )}
          </section>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => onToggleSave(internship.id)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-colors ${
              isSaved
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-sky-600' : ''}`} />
            <span>{isSaved ? 'Tersimpan' : 'Simpan Lowongan'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tutup
            </button>
            {alreadyApplied ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-5 py-2.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Sudah Dilamar</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onApply(internship)}
                className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Lamar Sekarang
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
