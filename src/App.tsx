import { useCallback, useEffect, useMemo, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { AdminDashboard } from './components/AdminDashboard';
import { ApplyModal } from './components/ApplyModal';
import { AuthModal } from './components/AuthModal';
import { DEFAULT_FILTERS, ExplorePage } from './components/ExplorePage';
import type { ExploreFilters } from './components/ExplorePage';
import { Footer } from './components/Footer';
import { InternshipDetailModal } from './components/InternshipDetailModal';
import { LandingPage } from './components/LandingPage';
import { Navbar } from './components/Navbar';
import type { PageView } from './components/Navbar';
import { UserDashboard } from './components/UserDashboard';
import { apiRequest, getStoredToken, setStoredToken } from './lib/api';
import type {
  ActivityItem,
  ApplicationRecord,
  Internship,
  PlatformStats,
  UserProfile,
  WorkSystem,
} from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    total_companies: 0,
    total_internships: 0,
    total_users: 0,
    total_applications: 0,
  });
  const [exploreFilters, setExploreFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [savedInternships, setSavedInternships] = useState<Internship[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [applyingInternship, setApplyingInternship] = useState<Internship | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);
  const [pendingApply, setPendingApply] = useState<Internship | null>(null);
  const [pendingSaveId, setPendingSaveId] = useState<number | null>(null);

  const loadPublicData = useCallback(async () => {
    try {
      const [intData, statData] = await Promise.all([
        apiRequest<Internship[]>('/api/internships'),
        apiRequest<PlatformStats>('/api/stats'),
      ]);
      setInternships(intData);
      setStats(statData);
    } catch {
      // ignore initial transient errors
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const [apps, saved, acts] = await Promise.all([
        apiRequest<ApplicationRecord[]>('/api/applications/me'),
        apiRequest<Internship[]>('/api/saved'),
        apiRequest<ActivityItem[]>('/api/activities/me'),
      ]);
      setApplications(apps);
      setSavedInternships(saved);
      setActivities(acts);
    } catch {
      // ignore if session expired
    }
  }, []);

  useEffect(() => {
    void loadPublicData();

    const token = getStoredToken();
    if (token) {
      apiRequest<{ user: UserProfile }>('/api/auth/me')
        .then((res) => {
          setUser(res.user);
          void loadUserData();
        })
        .catch(() => {
          setStoredToken(null);
        });
    }
  }, [loadPublicData, loadUserData]);

  const savedIds = useMemo(
    () => new Set(savedInternships.map((i) => i.id)),
    [savedInternships]
  );

  const appliedInternshipIds = useMemo(
    () => new Set(applications.map((a) => a.internship_id)),
    [applications]
  );

  const handleNavigate = (page: PageView, sectionId?: string) => {
    setCurrentPage(page);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHeroSearchSubmit = (incoming: {
    q?: string;
    location?: string;
    work_system?: WorkSystem | 'Semua';
    category?: string;
  }) => {
    setExploreFilters({
      ...DEFAULT_FILTERS,
      q: incoming.q ?? '',
      location: incoming.location ?? 'Semua',
      work_system: incoming.work_system ?? 'Semua',
      category: incoming.category ?? 'Semua',
    });
    setCurrentPage('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleSave = async (internshipId: number) => {
    if (!user) {
      setPendingSaveId(internshipId);
      setAuthPromptMessage('Silakan masuk atau daftar akun untuk menyimpan lowongan.');
      setAuthModalOpen(true);
      return;
    }

    if (savedIds.has(internshipId)) {
      await apiRequest(`/api/saved/${internshipId}`, { method: 'DELETE' });
    } else {
      await apiRequest(`/api/saved/${internshipId}`, { method: 'POST' });
    }
    await loadUserData();
  };

  const handleStartApply = (internship: Internship) => {
    if (!user) {
      setPendingApply(internship);
      setSelectedInternship(null);
      setAuthPromptMessage('Masuk atau buat akun terlebih dahulu untuk mengirim lamaran magang.');
      setAuthModalOpen(true);
      return;
    }
    setSelectedInternship(null);
    setApplyingInternship(internship);
  };

  const handleAuthSuccess = async (token: string, authedUser: UserProfile) => {
    setStoredToken(token);
    setUser(authedUser);
    setAuthModalOpen(false);
    setAuthPromptMessage(undefined);

    await loadUserData();

    if (pendingSaveId !== null) {
      const idToSave = pendingSaveId;
      setPendingSaveId(null);
      await apiRequest(`/api/saved/${idToSave}`, { method: 'POST' }).catch(() => {});
      await loadUserData();
    }

    if (pendingApply) {
      const target = pendingApply;
      setPendingApply(null);
      setApplyingInternship(target);
      return;
    }

    if (authedUser.role === 'admin') {
      setCurrentPage('admin');
    } else if (currentPage === 'home') {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setStoredToken(null);
    setUser(null);
    setApplications([]);
    setSavedInternships([]);
    setActivities([]);
    setCurrentPage('home');
  };

  const handleApplicationSuccess = async () => {
    await Promise.all([loadUserData(), loadPublicData()]);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <Navbar
          currentPage={currentPage}
          user={user}
          onNavigate={handleNavigate}
          onOpenAuth={() => {
            setAuthPromptMessage(undefined);
            setAuthModalOpen(true);
          }}
          onLogout={handleLogout}
        />

        <div className="flex-1">
          {currentPage === 'home' && (
            <LandingPage
              internships={internships}
              stats={stats}
              savedIds={savedIds}
              onSearchSubmit={handleHeroSearchSubmit}
              onSelectInternship={setSelectedInternship}
              onToggleSave={handleToggleSave}
              onNavigateExplore={() => handleNavigate('explore')}
            />
          )}

          {currentPage === 'explore' && (
            <ExplorePage
              internships={internships}
              filters={exploreFilters}
              savedIds={savedIds}
              onFiltersChange={setExploreFilters}
              onSelectInternship={setSelectedInternship}
              onToggleSave={handleToggleSave}
            />
          )}

          {currentPage === 'dashboard' && user && (
            <UserDashboard
              user={user}
              internships={internships}
              applications={applications}
              savedInternships={savedInternships}
              savedIds={savedIds}
              activities={activities}
              onSelectInternship={setSelectedInternship}
              onToggleSave={handleToggleSave}
              onUserUpdated={(updated) => {
                setUser(updated);
                void loadUserData();
              }}
              onExploreClick={() => handleNavigate('explore')}
              onLogout={handleLogout}
            />
          )}

          {currentPage === 'admin' && user?.role === 'admin' && (
            <AdminDashboard
              currentUser={user}
              onDataChanged={() => void loadPublicData()}
              onLogout={handleLogout}
            />
          )}
        </div>

        <Footer onNavigate={handleNavigate} />

        {/* Detail Modal */}
        <InternshipDetailModal
          internship={selectedInternship}
          isSaved={selectedInternship ? savedIds.has(selectedInternship.id) : false}
          alreadyApplied={
            selectedInternship ? appliedInternshipIds.has(selectedInternship.id) : false
          }
          onClose={() => setSelectedInternship(null)}
          onApply={handleStartApply}
          onToggleSave={handleToggleSave}
        />

        {/* Application Submission Modal */}
        {user && (
          <ApplyModal
            internship={applyingInternship}
            user={user}
            onClose={() => setApplyingInternship(null)}
            onSuccess={() => void handleApplicationSuccess()}
            onGoToDashboard={() => handleNavigate(user.role === 'admin' ? 'admin' : 'dashboard')}
          />
        )}

        {/* Auth Modal */}
        <AuthModal
          open={authModalOpen}
          promptMessage={authPromptMessage}
          onClose={() => {
            setAuthModalOpen(false);
            setPendingApply(null);
            setPendingSaveId(null);
            setAuthPromptMessage(undefined);
          }}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    </MotionConfig>
  );
}
