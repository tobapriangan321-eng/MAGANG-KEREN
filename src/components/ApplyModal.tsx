import { useState } from 'react';
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { apiRequest, uploadDocument } from '../lib/api';
import type { ApplicationRecord, Internship, UserProfile } from '../types';

interface ApplyModalProps {
  internship: Internship | null;
  user: UserProfile;
  onClose: () => void;
  onSuccess: (application: ApplicationRecord) => void;
  onGoToDashboard: () => void;
}

export function ApplyModal({
  internship,
  user,
  onClose,
  onSuccess,
  onGoToDashboard,
}: ApplyModalProps) {
  const [applicantName, setApplicantName] = useState(user.name);
  const [applicantEmail, setApplicantEmail] = useState(user.email);
  const [applicantPhone, setApplicantPhone] = useState(user.phone || '');
  const [educationLevel, setEducationLevel] = useState<string>(user.education_level || 'Mahasiswa');
  const [institution, setInstitution] = useState(user.institution || '');
  const [availabilityDate, setAvailabilityDate] = useState('2027-01-15');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const [cvFilename, setCvFilename] = useState(user.cv_filename || '');
  const [cvUrl, setCvUrl] = useState(user.cv_url || '');
  const [supportFilename, setSupportFilename] = useState('');
  const [supportUrl, setSupportUrl] = useState('');

  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingSupport, setUploadingSupport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRecord, setSubmittedRecord] = useState<ApplicationRecord | null>(null);

  if (!internship) return null;

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingCv(true);
    try {
      const res = await uploadDocument(file);
      setCvFilename(res.filename);
      setCvUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah CV.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSupportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploadingSupport(true);
    try {
      const res = await uploadDocument(file);
      setSupportFilename(res.filename);
      setSupportUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah dokumen pendukung.');
    } finally {
      setUploadingSupport(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!applicantPhone.trim() || !institution.trim() || !coverLetter.trim()) {
      setError('Mohon lengkapi nomor telepon, asal institusi, dan surat motivasi Anda.');
      return;
    }
    if (!cvUrl) {
      setError('Anda wajib melampirkan CV (unggah baru atau gunakan CV profil).');
      return;
    }

    setSubmitting(true);
    try {
      const record = await apiRequest<ApplicationRecord>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          internship_id: internship.id,
          applicant_name: applicantName,
          applicant_email: applicantEmail,
          applicant_phone: applicantPhone,
          education_level: educationLevel,
          institution,
          cover_letter: coverLetter,
          availability_date: availabilityDate,
          portfolio_url: portfolioUrl,
          cv_filename: cvFilename,
          cv_url: cvUrl,
          support_doc_filename: supportFilename,
          support_doc_url: supportUrl,
        }),
      });
      setSubmittedRecord(record);
      onSuccess(record);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim lamaran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-medium text-sky-600">Formulir Pendaftaran Magang</p>
            <h2 id="apply-modal-title" className="font-display text-lg font-bold text-slate-900">
              {internship.title} — {internship.company_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir pendaftaran"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submittedRecord ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-slate-900">
              Lamaran Berhasil Dikirim!
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Lamaran Anda untuk posisi <span className="font-semibold text-slate-900">{internship.title}</span> di {internship.company_name} telah diterima oleh sistem.
            </p>

            <div className="mx-auto mt-6 max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Kode Referensi</span>
                <span className="font-mono font-bold text-slate-900">
                  {submittedRecord.reference_code}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status Saat Ini</span>
                <span className="font-semibold text-amber-700">{submittedRecord.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">CV Terlampir</span>
                <span className="truncate max-w-[180px] font-medium text-slate-800">
                  {submittedRecord.cv_filename}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali ke Lowongan
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToDashboard();
                }}
                className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Pantau di Dashboard Saya
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Aktif *
                </label>
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812-3456-7890"
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Jenjang Pendidikan *
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Fresh Graduate">Fresh Graduate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Nama Sekolah / Perguruan Tinggi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Institut Teknologi Bandung"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Ketersediaan Mulai Magang *
                </label>
                <input
                  type="date"
                  required
                  value={availabilityDate}
                  onChange={(e) => setAvailabilityDate(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Tautan Portofolio / LinkedIn / GitHub (Opsional)
              </label>
              <input
                type="url"
                placeholder="https://github.com/username atau https://linkedin.com/in/..."
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Alasan Ketertarikan &amp; Ringkasan Kompetensi *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Ceritakan secara singkat pengalaman proyek, organisasi, atau keahlian yang relevan dengan posisi magang ini..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 gap-4 pt-1 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="text-xs font-semibold text-slate-800">
                  Curriculum Vitae (CV) *
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Format PDF/DOC/DOCX (maks. 5 MB)
                </p>

                {cvUrl ? (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-white px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                      <span className="truncate font-medium text-slate-800">
                        {cvFilename}
                      </span>
                    </div>
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 font-semibold text-sky-600 hover:underline"
                    >
                      Lihat
                    </a>
                  </div>
                ) : null}

                <label className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {uploadingCv ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{cvUrl ? 'Ganti File CV' : 'Unggah CV'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCvUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="text-xs font-semibold text-slate-800">
                  Dokumen Pendukung (Opsional)
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Surat pengantar PKL, transkrip, atau sertifikat
                </p>

                {supportUrl ? (
                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="truncate font-medium text-slate-800">
                        {supportFilename}
                      </span>
                    </div>
                    <a
                      href={supportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 font-semibold text-sky-600 hover:underline"
                    >
                      Lihat
                    </a>
                  </div>
                ) : null}

                <label className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  {uploadingSupport ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>{supportUrl ? 'Ganti Dokumen' : 'Unggah Dokumen'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleSupportUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingCv || uploadingSupport}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Kirim Lamaran</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
