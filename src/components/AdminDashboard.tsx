import { useEffect, useState } from 'react';
import {
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  Edit3,
  FileText,
  Loader2,
  LogOut,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { apiRequest, formatIndonesianDate } from '../lib/api';
import { INTERNSHIP_CATEGORIES } from '../types';
import type {
  ApplicationRecord,
  ApplicationStatus,
  Company,
  EducationLevel,
  Internship,
  UserProfile,
  WorkSystem,
} from '../types';
import { CompanyLogo } from './CompanyLogo';
import { StatusBadge } from './StatusBadge';

type AdminTab = 'overview' | 'internships' | 'companies' | 'applications' | 'users';

interface AdminOverview {
  total_users: number;
  total_companies: number;
  total_internships: number;
  active_internships: number;
  total_applications: number;
  status_breakdown: { status: string; count: number }[];
  category_breakdown: { category: string; count: number }[];
}

interface AdminUserRow extends UserProfile {
  applications_count: number;
}

interface AdminDashboardProps {
  currentUser: UserProfile;
  onDataChanged: () => void;
  onLogout: () => void;
}

export function AdminDashboard({
  currentUser,
  onDataChanged,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');

  // Internship Form Modal state
  const [internshipModalOpen, setInternshipModalOpen] = useState(false);
  const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
  const [intForm, setIntForm] = useState({
    company_id: '',
    title: '',
    category: INTERNSHIP_CATEGORIES[0] as string,
    location: '',
    work_system: 'Hybrid' as WorkSystem,
    duration: '3 Bulan',
    education_level: 'Mahasiswa' as EducationLevel,
    stipend: 'Rp 2.500.000 / bulan',
    deadline: '2027-03-01',
    description: '',
    qualifications: '',
    responsibilities: '',
    benefits: '',
    document_requirements: '',
    is_featured: true,
    status: 'Aktif' as 'Aktif' | 'Ditutup',
  });

  // Company Form Modal state
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [compForm, setCompForm] = useState({
    name: '',
    industry: INTERNSHIP_CATEGORIES[0] as string,
    location: '',
    website: '',
    description: '',
    logo_code: '',
    logo_color: '#0F172A',
    employee_count: '50-200 Karyawan',
  });

  // Application Review Modal state
  const [reviewingApp, setReviewingApp] = useState<ApplicationRecord | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('Menunggu Review');
  const [reviewNote, setReviewNote] = useState('');

  const [savingAction, setSavingAction] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [ov, ints, comps, apps, usrs] = await Promise.all([
        apiRequest<AdminOverview>('/api/admin/overview'),
        apiRequest<Internship[]>('/api/internships?include_closed=true'),
        apiRequest<Company[]>('/api/companies'),
        apiRequest<ApplicationRecord[]>('/api/admin/applications'),
        apiRequest<AdminUserRow[]>('/api/admin/users'),
      ]);
      setOverview(ov);
      setInternships(ints);
      setCompanies(comps);
      setApplications(apps);
      setUsers(usrs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllAdminData();
  }, []);

  const openAddInternship = () => {
    setEditingInternship(null);
    setIntForm({
      company_id: companies[0] ? String(companies[0].id) : '',
      title: '',
      category: INTERNSHIP_CATEGORIES[0],
      location: 'Jakarta Selatan',
      work_system: 'Hybrid',
      duration: '3 Bulan',
      education_level: 'Mahasiswa',
      stipend: 'Rp 3.000.000 / bulan',
      deadline: '2027-03-31',
      description: '',
      qualifications: 'Mahasiswa aktif atau lulusan baru sesuai bidang\nKomunikatif dan siap belajar',
      responsibilities: 'Membantu proyek tim operasional\nMenyusun laporan evaluasi mingguan',
      benefits: 'Uang saku bulanan\nSertifikat magang resmi\nMentoring intensif',
      document_requirements: 'Curriculum Vitae (CV) terbaru\nTranskrip nilai atau surat pengantar',
      is_featured: true,
      status: 'Aktif',
    });
    setInternshipModalOpen(true);
  };

  const openEditInternship = (item: Internship) => {
    setEditingInternship(item);
    setIntForm({
      company_id: String(item.company_id),
      title: item.title,
      category: item.category,
      location: item.location,
      work_system: item.work_system,
      duration: item.duration,
      education_level: item.education_level,
      stipend: item.stipend,
      deadline: item.deadline,
      description: item.description,
      qualifications: item.qualifications.join('\n'),
      responsibilities: item.responsibilities.join('\n'),
      benefits: item.benefits.join('\n'),
      document_requirements: item.document_requirements.join('\n'),
      is_featured: item.is_featured,
      status: item.status,
    });
    setInternshipModalOpen(true);
  };

  const handleSaveInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAction(true);
    try {
      const splitLines = (s: string) =>
        s
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

      const payload = {
        ...intForm,
        company_id: Number(intForm.company_id),
        duration_months: parseInt(intForm.duration, 10) || 3,
        qualifications: splitLines(intForm.qualifications),
        responsibilities: splitLines(intForm.responsibilities),
        benefits: splitLines(intForm.benefits),
        document_requirements: splitLines(intForm.document_requirements),
      };

      if (editingInternship) {
        await apiRequest(`/api/admin/internships/${editingInternship.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setFeedback('Lowongan magang berhasil diperbarui.');
      } else {
        await apiRequest('/api/admin/internships', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFeedback('Lowongan magang baru berhasil ditambahkan.');
      }

      setInternshipModalOpen(false);
      await loadAllAdminData();
      onDataChanged();
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteInternship = async (id: number) => {
    await apiRequest(`/api/admin/internships/${id}`, { method: 'DELETE' });
    setFeedback('Lowongan magang berhasil dihapus.');
    await loadAllAdminData();
    onDataChanged();
  };

  const openAddCompany = () => {
    setEditingCompany(null);
    setCompForm({
      name: '',
      industry: INTERNSHIP_CATEGORIES[0],
      location: '',
      website: '',
      description: '',
      logo_code: '',
      logo_color: '#0F172A',
      employee_count: '50-200 Karyawan',
    });
    setCompanyModalOpen(true);
  };

  const openEditCompany = (comp: Company) => {
    setEditingCompany(comp);
    setCompForm({
      name: comp.name,
      industry: comp.industry,
      location: comp.location,
      website: comp.website,
      description: comp.description,
      logo_code: comp.logo_code,
      logo_color: comp.logo_color,
      employee_count: comp.employee_count,
    });
    setCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAction(true);
    try {
      if (editingCompany) {
        await apiRequest(`/api/admin/companies/${editingCompany.id}`, {
          method: 'PUT',
          body: JSON.stringify(compForm),
        });
        setFeedback('Data perusahaan berhasil diperbarui.');
      } else {
        await apiRequest('/api/admin/companies', {
          method: 'POST',
          body: JSON.stringify(compForm),
        });
        setFeedback('Perusahaan mitra baru berhasil ditambahkan.');
      }
      setCompanyModalOpen(false);
      await loadAllAdminData();
      onDataChanged();
    } finally {
      setSavingAction(false);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    await apiRequest(`/api/admin/companies/${id}`, { method: 'DELETE' });
    setFeedback('Perusahaan berhasil dihapus.');
    await loadAllAdminData();
    onDataChanged();
  };

  const openReviewModal = (app: ApplicationRecord) => {
    setReviewingApp(app);
    setReviewStatus(app.status);
    setReviewNote(app.admin_note || '');
  };

  const handleUpdateAppStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingApp) return;
    setSavingAction(true);
    try {
      await apiRequest(`/api/admin/applications/${reviewingApp.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: reviewStatus, admin_note: reviewNote }),
      });
      setReviewingApp(null);
      setFeedback(`Status lamaran ${reviewingApp.reference_code} diperbarui menjadi ${reviewStatus}.`);
      await loadAllAdminData();
      onDataChanged();
    } finally {
      setSavingAction(false);
    }
  };

  const handleToggleUserRole = async (usr: AdminUserRow) => {
    const nextRole = usr.role === 'admin' ? 'user' : 'admin';
    await apiRequest(`/api/admin/users/${usr.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: nextRole }),
    });
    setFeedback(`Peran ${usr.name} diubah menjadi ${nextRole}.`);
    await loadAllAdminData();
  };

  const handleDeleteUser = async (usr: AdminUserRow) => {
    await apiRequest(`/api/admin/users/${usr.id}`, { method: 'DELETE' });
    setFeedback(`Pengguna ${usr.name} berhasil dihapus.`);
    await loadAllAdminData();
    onDataChanged();
  };

  const navItems: { id: AdminTab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Statistik Platform', icon: BarChart3 },
    { id: 'internships', label: 'Kelola Lowongan', icon: Briefcase },
    { id: 'companies', label: 'Kelola Perusahaan', icon: Building2 },
    { id: 'applications', label: 'Semua Lamaran', icon: ClipboardList },
    { id: 'users', label: 'Data Pengguna', icon: Users },
  ];

  const filteredInternships = internships.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApplications = applications.filter((a) => {
    const matchesStatus = statusFilter === 'Semua' || a.status === statusFilter;
    const matchesQuery =
      a.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.internship_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.reference_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[80vh] bg-slate-50/70">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Admin Sidebar */}
          <aside className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="border-b border-slate-100 pb-3.5">
                <p className="text-[11px] font-semibold text-sky-600">Panel Administrator</p>
                <p className="mt-0.5 truncate font-display text-sm font-bold text-slate-900">
                  {currentUser.name}
                </p>
                <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
              </div>

              <nav className="mt-3 space-y-1" aria-label="Menu Admin">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setSearchQuery('');
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Keluar Admin</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Admin Viewport */}
          <main className="lg:col-span-9 space-y-6">
            {feedback && (
              <div className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-medium text-sky-900">
                <span>{feedback}</span>
                <button
                  type="button"
                  onClick={() => setFeedback('')}
                  className="cursor-pointer text-sky-700 hover:text-sky-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {loading || !overview ? (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-sky-600" />
                <p className="mt-2">Memuat data administrator...</p>
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW STATS */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-medium text-slate-500">Total Peserta</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {overview.total_users}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-medium text-slate-500">Perusahaan Mitra</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {overview.total_companies}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-medium text-slate-500">Lowongan Aktif</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-sky-600 tabular-nums">
                          {overview.active_internships}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-medium text-slate-500">Total Lamaran</div>
                        <div className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                          {overview.total_applications}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <section className="rounded-xl border border-slate-200 bg-white p-5">
                        <h2 className="font-display text-sm font-bold text-slate-900">
                          Distribusi Status Lamaran
                        </h2>
                        <div className="mt-4 space-y-3">
                          {(
                            [
                              'Menunggu Review',
                              'Sedang Diproses',
                              'Diterima',
                              'Ditolak',
                            ] as ApplicationStatus[]
                          ).map((st) => {
                            const found = overview.status_breakdown.find((s) => s.status === st);
                            const count = found ? found.count : 0;
                            const pct =
                              overview.total_applications > 0
                                ? Math.round((count / overview.total_applications) * 100)
                                : 0;
                            return (
                              <div key={st} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <StatusBadge status={st} />
                                  <span className="font-mono font-semibold text-slate-700 tabular-nums">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full bg-slate-900"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <section className="rounded-xl border border-slate-200 bg-white p-5">
                        <h2 className="font-display text-sm font-bold text-slate-900">
                          Lowongan per Bidang Industri
                        </h2>
                        <div className="mt-4 divide-y divide-slate-100">
                          {overview.category_breakdown.map((cat) => (
                            <div
                              key={cat.category}
                              className="flex items-center justify-between py-2 text-xs"
                            >
                              <span className="font-medium text-slate-700">{cat.category}</span>
                              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                                {cat.count} posisi
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  </div>
                )}

                {/* TAB 2: MANAGE INTERNSHIPS */}
                {activeTab === 'internships' && (
                  <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-display text-base font-bold text-slate-900">
                          Kelola Lowongan Magang
                        </h2>
                        <p className="text-xs text-slate-500">
                          Tambah, edit, atau hapus program magang yang tampil di platform.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openAddInternship}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Lowongan</span>
                      </button>
                    </div>

                    <div className="relative mt-4">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari posisi atau nama perusahaan..."
                        className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2.5 pr-4 font-semibold">Posisi &amp; Perusahaan</th>
                            <th className="py-2.5 px-3 font-semibold">Sistem</th>
                            <th className="py-2.5 px-3 font-semibold">Jenjang</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Pelamar</th>
                            <th className="py-2.5 px-3 font-semibold">Status</th>
                            <th className="py-2.5 pl-3 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredInternships.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/70">
                              <td className="py-3 pr-4">
                                <div className="font-semibold text-slate-900">{item.title}</div>
                                <div className="text-[11px] text-slate-500">
                                  {item.company_name} · {item.location}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                                {item.work_system}
                              </td>
                              <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                                {item.education_level}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                                {item.applicants_count ?? 0}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`font-semibold ${
                                    item.status === 'Aktif'
                                      ? 'text-emerald-700'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 pl-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditInternship(item)}
                                    aria-label={`Edit ${item.title}`}
                                    className="cursor-pointer rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteInternship(item.id)}
                                    aria-label={`Hapus ${item.title}`}
                                    className="cursor-pointer rounded-md border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {/* TAB 3: MANAGE COMPANIES */}
                {activeTab === 'companies' && (
                  <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                      <div>
                        <h2 className="font-display text-base font-bold text-slate-900">
                          Kelola Perusahaan Mitra
                        </h2>
                        <p className="text-xs text-slate-500">
                          Daftar perusahaan yang membuka program magang di MAGANG KEREN.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openAddCompany}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Perusahaan</span>
                      </button>
                    </div>

                    <div className="mt-4 divide-y divide-slate-100">
                      {companies.map((comp) => (
                        <div
                          key={comp.id}
                          className="flex flex-col justify-between gap-4 py-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3.5">
                            <CompanyLogo
                              code={comp.logo_code}
                              color={comp.logo_color}
                              name={comp.name}
                            />
                            <div>
                              <h3 className="font-display text-sm font-bold text-slate-900">
                                {comp.name}
                              </h3>
                              <p className="text-xs text-slate-500">
                                {comp.industry} · {comp.location} · {comp.employee_count}
                              </p>
                              <p className="mt-1 text-xs text-slate-600 max-w-xl">
                                {comp.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditCompany(comp)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteCompany(comp.id)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* TAB 4: ALL APPLICATIONS */}
                {activeTab === 'applications' && (
                  <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="font-display text-base font-bold text-slate-900">
                        Seluruh Lamaran Masuk
                      </h2>
                      <p className="text-xs text-slate-500">
                        Tinjau berkas CV pelamar dan perbarui status seleksi kandidat.
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari pelamar, posisi, atau kode referensi..."
                          className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="Semua">Semua Status</option>
                        <option value="Menunggu Review">Menunggu Review</option>
                        <option value="Sedang Diproses">Sedang Diproses</option>
                        <option value="Diterima">Diterima</option>
                        <option value="Ditolak">Ditolak</option>
                      </select>
                    </div>

                    <div className="mt-4 space-y-3">
                      {filteredApplications.map((app) => (
                        <div
                          key={app.id}
                          className="rounded-xl border border-slate-200 p-4 space-y-3"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-sky-700">
                                  {app.reference_code}
                                </span>
                                <span className="text-xs text-slate-300">·</span>
                                <span className="font-display text-sm font-bold text-slate-900">
                                  {app.applicant_name}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-slate-600">
                                Melamar: <span className="font-semibold">{app.internship_title}</span> ({app.company_name})
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {app.education_level} · {app.institution} · {app.applicant_email} · {app.applicant_phone} ·{' '}
                                <span className="tabular-nums">Dikirim {formatIndonesianDate(app.created_at)}</span>
                              </p>
                            </div>
                            <StatusBadge status={app.status} />
                          </div>

                          <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 rounded-lg p-3">
                            {app.cover_letter}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                            <div className="flex flex-wrap items-center gap-4">
                              <a
                                href={app.cv_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-sky-600 hover:underline"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Unduh CV ({app.cv_filename})</span>
                              </a>
                              {app.support_doc_url && (
                                <a
                                  href={app.support_doc_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:underline"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>Dokumen Pendukung</span>
                                </a>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => openReviewModal(app)}
                              className="cursor-pointer rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                              Perbarui Status
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* TAB 5: MANAGE USERS */}
                {activeTab === 'users' && (
                  <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="font-display text-base font-bold text-slate-900">
                        Data Pengguna Terdaftar
                      </h2>
                      <p className="text-xs text-slate-500">
                        Kelola akun peserta magang dan hak akses administrator.
                      </p>
                    </div>

                    <div className="relative mt-4">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau email pengguna..."
                        className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2.5 pr-4 font-semibold">Nama &amp; Email</th>
                            <th className="py-2.5 px-3 font-semibold">Pendidikan</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Lamaran</th>
                            <th className="py-2.5 px-3 font-semibold">Peran</th>
                            <th className="py-2.5 pl-3 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50/70">
                              <td className="py-3 pr-4">
                                <div className="font-semibold text-slate-900">{u.name}</div>
                                <div className="text-[11px] text-slate-500">{u.email}</div>
                              </td>
                              <td className="py-3 px-3 text-slate-700">
                                <div>{u.education_level}</div>
                                <div className="text-[11px] text-slate-500">{u.institution || '-'}</div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                                {u.applications_count}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`font-semibold ${
                                    u.role === 'admin' ? 'text-sky-700' : 'text-slate-700'
                                  }`}
                                >
                                  {u.role === 'admin' ? 'Admin' : 'Peserta'}
                                </span>
                              </td>
                              <td className="py-3 pl-3 text-right whitespace-nowrap">
                                {u.id !== currentUser.id ? (
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void handleToggleUserRole(u)}
                                      className="cursor-pointer rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                                    >
                                      {u.role === 'admin' ? 'Jadikan Peserta' : 'Jadikan Admin'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDeleteUser(u)}
                                      aria-label={`Hapus ${u.name}`}
                                      className="cursor-pointer rounded-md border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Akun Aktif</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* MODAL: ADD / EDIT INTERNSHIP */}
      {internshipModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={() => setInternshipModalOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingInternship ? 'Edit Lowongan Magang' : 'Tambah Lowongan Magang Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setInternshipModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInternship} className="overflow-y-auto px-6 py-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700">Perusahaan *</label>
                  <select
                    required
                    value={intForm.company_id}
                    onChange={(e) => setIntForm({ ...intForm, company_id: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Posisi Magang *</label>
                  <input
                    type="text"
                    required
                    value={intForm.title}
                    onChange={(e) => setIntForm({ ...intForm, title: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block font-semibold text-slate-700">Bidang Industri *</label>
                  <select
                    value={intForm.category}
                    onChange={(e) => setIntForm({ ...intForm, category: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    {INTERNSHIP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Sistem Kerja *</label>
                  <select
                    value={intForm.work_system}
                    onChange={(e) =>
                      setIntForm({ ...intForm, work_system: e.target.value as WorkSystem })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    <option value="WFO">WFO</option>
                    <option value="WFH">WFH</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Jenjang *</label>
                  <select
                    value={intForm.education_level}
                    onChange={(e) =>
                      setIntForm({
                        ...intForm,
                        education_level: e.target.value as EducationLevel,
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Fresh Graduate">Fresh Graduate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="block font-semibold text-slate-700">Lokasi *</label>
                  <input
                    type="text"
                    required
                    value={intForm.location}
                    onChange={(e) => setIntForm({ ...intForm, location: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Durasi *</label>
                  <input
                    type="text"
                    required
                    value={intForm.duration}
                    onChange={(e) => setIntForm({ ...intForm, duration: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Batas Daftar *</label>
                  <input
                    type="date"
                    required
                    value={intForm.deadline}
                    onChange={(e) => setIntForm({ ...intForm, deadline: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Status</label>
                  <select
                    value={intForm.status}
                    onChange={(e) =>
                      setIntForm({
                        ...intForm,
                        status: e.target.value as 'Aktif' | 'Ditutup',
                      })
                    }
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Ditutup">Ditutup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Kompensasi / Uang Saku</label>
                <input
                  type="text"
                  value={intForm.stipend}
                  onChange={(e) => setIntForm({ ...intForm, stipend: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Deskripsi Pekerjaan *</label>
                <textarea
                  rows={3}
                  required
                  value={intForm.description}
                  onChange={(e) => setIntForm({ ...intForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-semibold text-slate-700">
                    Kualifikasi (1 poin per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={intForm.qualifications}
                    onChange={(e) => setIntForm({ ...intForm, qualifications: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    Tanggung Jawab (1 poin per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={intForm.responsibilities}
                    onChange={(e) => setIntForm({ ...intForm, responsibilities: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    Keuntungan (1 poin per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={intForm.benefits}
                    onChange={(e) => setIntForm({ ...intForm, benefits: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    Persyaratan Dokumen (1 poin per baris)
                  </label>
                  <textarea
                    rows={3}
                    value={intForm.document_requirements}
                    onChange={(e) =>
                      setIntForm({ ...intForm, document_requirements: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setInternshipModalOpen(false)}
                  className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
                >
                  {savingAction && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingInternship ? 'Simpan Perubahan' : 'Terbitkan Lowongan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPANY */}
      {companyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={() => setCompanyModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingCompany ? 'Edit Data Perusahaan' : 'Tambah Perusahaan Mitra'}
              </h3>
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCompany} className="px-6 py-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Nama Perusahaan *</label>
                <input
                  type="text"
                  required
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Bidang Industri *</label>
                  <select
                    value={compForm.industry}
                    onChange={(e) => setCompForm({ ...compForm, industry: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm"
                  >
                    {INTERNSHIP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Lokasi Kantor *</label>
                  <input
                    type="text"
                    required
                    value={compForm.location}
                    onChange={(e) => setCompForm({ ...compForm, location: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Situs Web</label>
                  <input
                    type="text"
                    value={compForm.website}
                    onChange={(e) => setCompForm({ ...compForm, website: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">Skala Karyawan</label>
                  <input
                    type="text"
                    value={compForm.employee_count}
                    onChange={(e) => setCompForm({ ...compForm, employee_count: e.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  value={compForm.description}
                  onChange={(e) => setCompForm({ ...compForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setCompanyModalOpen(false)}
                  className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
                >
                  {savingAction && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Perusahaan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPDATE APPLICATION STATUS */}
      {reviewingApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={() => setReviewingApp(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Perbarui Status Lamaran
                </h3>
                <p className="text-xs text-slate-500">
                  {reviewingApp.reference_code} · {reviewingApp.applicant_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="cursor-pointer rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateAppStatus} className="px-6 py-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Status Seleksi</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as ApplicationStatus)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="Menunggu Review">Menunggu Review</option>
                  <option value="Sedang Diproses">Sedang Diproses</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">
                  Catatan untuk Kandidat
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Contoh: Jadwal wawancara daring pada hari Kamis pukul 10.00 WIB..."
                  className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setReviewingApp(null)}
                  className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
                >
                  {savingAction && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
