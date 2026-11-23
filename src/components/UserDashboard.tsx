import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bookmark,
  Briefcase,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Plus,
  Upload,
  User,
  X,
} from 'lucide-react';
import { apiRequest, formatIndonesianDate, uploadDocument } from '../lib/api';
import { INTERNSHIP_CATEGORIES } from '../types';
import type {
  ActivityItem,
  ApplicationRecord,
  EducationLevel,
  Internship,
  UserProfile,
} from '../types';
import { CompanyLogo } from './CompanyLogo';
import { InternshipCard } from './InternshipCard';
import { StatusBadge } from './StatusBadge';

type UserTab = 'overview' | 'applications' | 'saved' | 'profile';

interface UserDashboardProps {
  user: UserProfile;
  internships: Internship[];
  applications: ApplicationRecord[];
  savedInternships: Internship[];
  savedIds: Set<number>;
  activities: ActivityItem[];
  onSelectInternship: (internship: Internship) => void;
  onToggleSave: (internshipId: number) => void;
  onUserUpdated: (user: UserProfile) => void;
  onExploreClick: () => void;
  onLogout: () => void;
}

export function UserDashboard({
  user,
  internships,
  applications,
  savedInternships,
  savedIds,
  activities,
  onSelectInternship,
  onToggleSave,
  onUserUpdated,
  onExploreClick,
  onLogout,
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<UserTab>('overview');
  const [avatarFailed, setAvatarFailed] = useState(false);

  // Profile form state
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city);
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(user.education_level);
  const [institution, setInstitution] = useState(user.institution);
  const [major, setMajor] = useState(user.major);
  const [graduationYear, setGraduationYear] = useState(user.graduation_year);
  const [bio, setBio] = useState(user.bio);
  const [skills, setSkills] = useState<string[]>(user.skills);
  const [newSkill, setNewSkill] = useState('');
  const [interests, setInterests] = useState<string[]>(user.interests);
  const [cvFilename, setCvFilename] = useState(user.cv_filename);
  const [cvUrl, setCvUrl] = useState(user.cv_url);

  const [uploadingCv, setUploadingCv] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
    setCity(user.city);
    setEducationLevel(user.education_level);
    setInstitution(user.institution);
    setMajor(user.major);
    setGraduationYear(user.graduation_year);
    setBio(user.bio);
    setSkills(user.skills);
    setInterests(user.interests);
    setCvFilename(user.cv_filename);
    setCvUrl(user.cv_url);
  }, [user]);

  const recommendations = useMemo(() => {
    const scored = internships.map((item) => {
      let score = 0;
      if (user.interests.includes(item.category)) score += 3;
      if (item.education_level === user.education_level) score += 2;
      if (item.is_featured) score += 1;
      return { item, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map((s) => s.item);
  }, [internships, user.interests, user.education_level]);

  const inProgressCount = applications.filter(
    (a) => a.status === 'Menunggu Review' || a.status === 'Sedang Diproses'
  ).length;
  const acceptedCount = applications.filter((a) => a.status === 'Diterima').length;

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkill('');
  };

  const handleToggleInterest = (cat: string) => {
    if (interests.includes(cat)) {
      setInterests(interests.filter((c) => c !== cat));
    } else {
      setInterests([...interests, cat]);
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileError('');
    setUploadingCv(true);
    try {
      const res = await uploadDocument(file);
      setCvFilename(res.filename);
      setCvUrl(res.url);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Gagal mengunggah CV.');
    } finally {
      setUploadingCv(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setSavingProfile(true);
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          phone,
          city,
          education_level: educationLevel,
          institution,
          major,
          graduation_year: graduationYear,
          bio,
          skills,
          interests,
          cv_filename: cvFilename,
          cv_url: cvUrl,
        }),
      });
      onUserUpdated(res.user);
      setProfileMessage('Perubahan profil dan CV berhasil disimpan.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Gagal menyimpan profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const navItems: { id: UserTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'applications', label: 'Riwayat Lamaran', icon: Briefcase },
    { id: 'saved', label: 'Tersimpan', icon: Bookmark },
    { id: 'profile', label: 'Profil & CV', icon: User },
  ];

  return (
    <div className="min-h-[80vh] bg-slate-50/70">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Workspace Sidebar */}
          <aside className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                {user.avatar_url && !avatarFailed ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarFailed(true)}
                    className="h-11 w-11 shrink-0 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 font-display text-sm font-bold text-white">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate font-display text-sm font-bold text-slate-900">
                    {user.name}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {user.education_level}
                    {user.institution ? ` · ${user.institution}` : ''}
                  </div>
                </div>
              </div>

              <nav className="mt-3 space-y-1" aria-label="Menu Dashboard Pengguna">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                      {item.id === 'applications' && (
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            active ? 'text-sky-300' : 'text-slate-400'
                          }`}
                        >
                          {applications.length}
                        </span>
                      )}
                      {item.id === 'saved' && (
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            active ? 'text-sky-300' : 'text-slate-400'
                          }`}
                        >
                          {savedInternships.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Keluar Akun</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Dashboard Content */}
          <main className="lg:col-span-9 space-y-6">
            {/* Contextual Header */}
            <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-medium text-sky-600">Dashboard Peserta</p>
                <h1 className="mt-1 font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Selamat datang kembali, {user.name.split(' ')[0]}
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Kelola lamaran magang, perbarui CV, dan pantau perkembangan seleksi Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700 whitespace-nowrap shrink-0"
              >
                Cari Lowongan Baru
              </button>
            </div>

            {/* 4 KPI Summary Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-500">Lamaran Dikirim</div>
                <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {applications.length}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-500">Dalam Proses</div>
                <div className="mt-2 font-mono text-2xl font-bold text-sky-600 tabular-nums">
                  {inProgressCount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-500">Diterima</div>
                <div className="mt-2 font-mono text-2xl font-bold text-emerald-600 tabular-nums">
                  {acceptedCount}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium text-slate-500">Tersimpan</div>
                <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                  {savedInternships.length}
                </div>
              </div>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Applications Preview */}
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Status Lamaran Terbaru
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('applications')}
                      className="cursor-pointer text-xs font-semibold text-sky-600 hover:underline"
                    >
                      Lihat Semua
                    </button>
                  </div>

                  {applications.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      Anda belum mengirimkan lamaran magang. Jelajahi lowongan yang sesuai minat Anda.
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {applications.slice(0, 3).map((app) => (
                        <div
                          key={app.id}
                          className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <CompanyLogo
                              code={app.company_logo_code}
                              color={app.company_logo_color}
                              name={app.company_name}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {app.internship_title}
                              </div>
                              <div className="text-xs text-slate-500">
                                {app.company_name} ·{' '}
                                <span className="font-mono">{app.reference_code}</span>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Personalized Recommendations */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-base font-bold text-slate-900">
                        Rekomendasi Magang Untukmu
                      </h2>
                      <p className="text-xs text-slate-500">
                        Diselaraskan dengan jenjang ({user.education_level}) dan minat bidang Anda.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {recommendations.map((item) => (
                      <InternshipCard
                        key={item.id}
                        internship={item}
                        isSaved={savedIds.has(item.id)}
                        onSelect={onSelectInternship}
                        onToggleSave={onToggleSave}
                      />
                    ))}
                  </div>
                </section>

                {/* Aktivitas Terbaru */}
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-sky-600" aria-hidden="true" />
                    <h2 className="font-display text-base font-bold text-slate-900">
                      Aktivitas Terbaru
                    </h2>
                  </div>

                  {activities.length === 0 ? (
                    <p className="mt-4 text-xs text-slate-500">Belum ada aktivitas tercatat.</p>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {activities.slice(0, 6).map((act) => (
                        <div key={act.id} className="py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">
                              {act.title}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                              {formatIndonesianDate(act.created_at)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TAB 2: APPLICATIONS HISTORY */}
            {activeTab === 'applications' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Riwayat Lamaran Magang
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Daftar seluruh lamaran yang telah Anda kirim beserta catatan dari tim rekrutmen.
                </p>

                {applications.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Belum ada riwayat lamaran.
                    </p>
                    <button
                      type="button"
                      onClick={onExploreClick}
                      className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Temukan Magang Pertama
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300"
                      >
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="flex items-start gap-3.5">
                            <CompanyLogo
                              code={app.company_logo_code}
                              color={app.company_logo_color}
                              name={app.company_name}
                            />
                            <div>
                              <h3 className="font-display text-sm font-bold text-slate-900">
                                {app.internship_title}
                              </h3>
                              <p className="text-xs text-slate-600">
                                {app.company_name} · {app.location} ({app.work_system})
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                <span className="font-mono font-semibold text-slate-700">
                                  {app.reference_code}
                                </span>
                                <span>·</span>
                                <span className="tabular-nums">
                                  Dikirim {formatIndonesianDate(app.created_at)}
                                </span>
                                <span>·</span>
                                <a
                                  href={app.cv_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>{app.cv_filename}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                          <StatusBadge status={app.status} />
                        </div>

                        {app.admin_note && (
                          <div className="mt-3 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                            <span className="font-semibold text-slate-900">Catatan Rekrutmen: </span>
                            {app.admin_note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB 3: SAVED INTERNSHIPS */}
            {activeTab === 'saved' && (
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="font-display text-base font-bold text-slate-900">
                  Lowongan Tersimpan
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Daftar lowongan yang Anda tandai untuk dilamar nanti.
                </p>

                {savedInternships.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center">
                    <p className="text-sm font-medium text-slate-700">
                      Belum ada lowongan yang disimpan.
                    </p>
                    <button
                      type="button"
                      onClick={onExploreClick}
                      className="mt-4 cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Jelajahi Lowongan
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {savedInternships.map((item) => (
                      <InternshipCard
                        key={item.id}
                        internship={item}
                        isSaved={true}
                        onSelect={onSelectInternship}
                        onToggleSave={onToggleSave}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB 4: PROFILE & CV */}
            {activeTab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-6"
              >
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    Profil, Pendidikan &amp; Unggah CV
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Data ini otomatis digunakan saat Anda mendaftar lowongan magang.
                  </p>
                </div>

                {profileMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{profileMessage}</span>
                  </div>
                )}
                {profileError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
                    {profileError}
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Kota Domisili
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Jakarta, Bandung, Surabaya..."
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Akun
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                    />
                  </div>
                </div>

                {/* Education */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Informasi Pendidikan
                  </h3>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Jenjang Pendidikan
                      </label>
                      <select
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-sky-500 focus:outline-none"
                      >
                        <option value="SMA/SMK">SMA/SMK</option>
                        <option value="Mahasiswa">Mahasiswa</option>
                        <option value="Fresh Graduate">Fresh Graduate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Sekolah / Perguruan Tinggi
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Jurusan / Program Studi
                      </label>
                      <input
                        type="text"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">
                        Perkiraan / Tahun Lulus
                      </label>
                      <input
                        type="text"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        placeholder="2027"
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Ringkasan Profil &amp; Tujuan Karier
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tuliskan latar belakang singkat dan fokus bidang yang ingin Anda pelajari..."
                    className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>

                {/* Skills */}
                <div className="border-t border-slate-100 pt-5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Keahlian (Skills)
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Tambah keahlian (contoh: React, Excel, Figma)"
                      className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm focus:border-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => setSkills(skills.filter((s) => s !== skill))}
                          aria-label={`Hapus ${skill}`}
                          className="cursor-pointer text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Bidang Minat Magang
                  </label>
                  <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {INTERNSHIP_CATEGORIES.map((cat) => {
                      const checked = interests.includes(cat);
                      return (
                        <label
                          key={cat}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                            checked
                              ? 'border-sky-300 bg-sky-50 text-sky-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleInterest(cat)}
                            className="h-3.5 w-3.5 accent-sky-600"
                          />
                          <span>{cat}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* CV Upload */}
                <div className="border-t border-slate-100 pt-5">
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Curriculum Vitae (CV)
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Unggah file CV terbaru dalam format PDF, DOC, atau DOCX (maksimal 5 MB).
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-sky-600" />
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold text-slate-900">
                          {cvFilename || 'Belum ada CV diunggah'}
                        </div>
                        {cvUrl && (
                          <a
                            href={cvUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] font-semibold text-sky-600 hover:underline"
                          >
                            Unduh / Pratinjau CV Tersimpan
                          </a>
                        )}
                      </div>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      {uploadingCv ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>{cvUrl ? 'Ganti CV' : 'Unggah CV'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCvUpload}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="submit"
                    disabled={savingProfile || uploadingCv}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingProfile && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Simpan Perubahan Profil</span>
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
