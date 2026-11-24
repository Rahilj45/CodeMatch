import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { Profile, SkillAnalysis, Recommendation, Submission } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeHandle, setActiveHandle] = useState<string>('Rahilj45');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analytics, setAnalytics] = useState<SkillAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadUserData = async (handleToLoad: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Profile
      const prof = await api.getProfile(handleToLoad);
      setProfile(prof);

      // 2. Fetch Submissions
      const subs = await api.getSubmissions(handleToLoad, 30);
      setSubmissions(subs);

      // 3. Fetch Analytics
      const anal = await api.getAnalytics(handleToLoad);
      setAnalytics(anal);

      // 4. Fetch Recommendations
      const recs = await api.getRecommendations(handleToLoad, 10);
      setRecommendations(recs);
    } catch (err: any) {
      console.warn('Initial load note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserData(activeHandle);
  }, [activeHandle]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await api.syncProfile(activeHandle);
      showToast(`Synced ${result.new_submissions_count} new submissions from Codeforces!`);
      await loadUserData(activeHandle);
    } catch (err: any) {
      showToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthSuccess = (newHandle: string) => {
    setActiveHandle(newHandle);
    showToast(`Signed in as ${newHandle}`);
    setCurrentPage('dashboard');
  };

  const handleOnboardingComplete = async (newHandle: string, goal: string, targetRating: number) => {
    setActiveHandle(newHandle);
    try {
      await api.updateProfile(newHandle, { target_goal: goal, target_rating: targetRating });
    } catch (_) {}
    showToast(`Profile linked to ${newHandle}!`);
    setCurrentPage('dashboard');
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            profile={profile}
            onGetStarted={() => setCurrentPage(profile ? 'dashboard' : 'onboarding')}
            onExplore={() => setCurrentPage('recommendations')}
          />
        );
      case 'auth':
        return <AuthPage onSuccess={handleAuthSuccess} defaultHandle={activeHandle} />;
      case 'onboarding':
        return <OnboardingPage onComplete={handleOnboardingComplete} initialHandle={activeHandle} />;
      case 'dashboard':
        return (
          <DashboardPage
            profile={profile}
            analytics={analytics}
            recommendations={recommendations}
            submissions={submissions}
            onSync={handleSync}
            isSyncing={isSyncing}
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
      case 'recommendations':
        return (
          <RecommendationsPage
            recommendations={recommendations}
            handle={activeHandle}
            onRefresh={() => loadUserData(activeHandle)}
            isLoading={isLoading}
          />
        );
      case 'analytics':
        return (
          <AnalyticsPage
            analytics={analytics}
            submissions={submissions}
            handle={activeHandle}
          />
        );
      case 'profile':
        return <ProfilePage profile={profile} onSync={handleSync} isSyncing={isSyncing} />;
      case 'settings':
        return (
          <SettingsPage
            profile={profile}
            onUpdateProfile={(p) => setProfile(p)}
            onSync={handleSync}
            isSyncing={isSyncing}
          />
        );
      default:
        return (
          <DashboardPage
            profile={profile}
            analytics={analytics}
            recommendations={recommendations}
            submissions={submissions}
            onSync={handleSync}
            isSyncing={isSyncing}
            onNavigate={(page) => setCurrentPage(page)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-slate-100">
      <Navbar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        profile={profile}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl border border-indigo-500/40 bg-surface shadow-2xl text-xs font-semibold text-slate-200 flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {renderCurrentPage()}
      </main>

      <Footer />
    </div>
  );
};

export default App;
