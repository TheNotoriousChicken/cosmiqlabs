import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
import MobileNav from './components/Layout/MobileNav';
import Overview from './pages/Overview';
import TopContent from './pages/TopContent';
import FollowerAnalytics from './pages/FollowerAnalytics';
import EngagementAnalytics from './pages/EngagementAnalytics';
import Demographics from './pages/Demographics';
import Settings from './pages/Settings';
import PostDetail from './pages/PostDetail';
import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useInstagramData } from './hooks/useInstagramData';
import DashboardAssistant from './components/AI/DashboardAssistant';

import { getUserByIgId } from './lib/db';

const IG_USER_ID = '17841410004708818';
import TopBar from './components/Layout/TopBar';

export default function App() {
  const { setAccessToken, accessToken, loadCached, mode, setDbUserId } = useAppStore();
  const { refresh, loadFromDB } = useInstagramData();

  useEffect(() => {
    const initialize = async () => {
      let currentDbUserId = useAppStore.getState().dbUserId;
      
      // Auto-link hardcoded account if first time on this device
      if (!currentDbUserId) {
        try {
          const user = await getUserByIgId(IG_USER_ID);
          if (user) {
            setDbUserId(user.id);
            currentDbUserId = user.id;
          }
        } catch (e) { console.error('Auto-link failed', e); }
      }

      if (currentDbUserId) {
        loadFromDB();
      }
    };

    initialize();
    loadCached();
    
    // Set token from Vercel Environment Variables if it exists and no token is saved locally
    if (!useAppStore.getState().accessToken && import.meta.env.VITE_IG_ACCESS_TOKEN) {
      setAccessToken(import.meta.env.VITE_IG_ACCESS_TOKEN);
    }
  }, []);

  // Background auto-refresh polling
  // This forcefully triggers the Vercel backend to sync with Instagram every 10 minutes.
  useEffect(() => {
    if (mode === 'live') {
      const interval = setInterval(() => {
        refresh(true); // true = silent refresh without loading screens
      }, 600000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [mode, refresh]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <TopBar />
          <Routes>
            <Route path="/"           element={<Overview />} />
            <Route path="/content"    element={<TopContent />} />
            <Route path="/post/:id"   element={<PostDetail />} />
            <Route path="/followers"  element={<FollowerAnalytics />} />
            <Route path="/engagement" element={<EngagementAnalytics />} />
            <Route path="/demographics" element={<Demographics />} />
            <Route path="/settings"   element={<Settings />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
      <DashboardAssistant />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </BrowserRouter>
  );
}
