import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Layout/Sidebar';
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

import { getUserByIgId } from './lib/db';

// Pre-seed the token so the app works out of the box
const PRESET_TOKEN = 'EAAY7lP7B3MQBSBqyN4A9fbfZB0YEI2k6wciJ6XuAkuFgbr7sA8bvOiYGwR3CeTXdJUrBMSkGKVpbczPNRAG9K4QH1AF90c8qbl22ZAWBPnsaJ7OpKXDyzmxuIqsoA1jhhFe2dJZC2ax1QEBCvsVHWgobiJ3VJbtkxshNMDFatUE08wKZAnwTisDWCNUiohQv';
const IG_USER_ID = '17841410004708818';

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

    // 2. Fall back to localStorage cache if DB is empty
    loadCached();
    // 3. Set the preset token if none stored
    if (!accessToken) {
      setAccessToken(PRESET_TOKEN);
    }
  }, []);

  // Background auto-refresh polling
  // IG Limit is ~200 calls/hour. One refresh makes ~33 API calls (Profile + Insights + 30 individual post insight calls).
  // 200 / 33 = ~6 refreshes per hour (Once every 10 minutes).
  useEffect(() => {
    if (mode === 'live' && accessToken) {
      const interval = setInterval(() => {
        refresh(true); // silent refresh
      }, 600000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [mode, accessToken, refresh]);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
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
      </div>
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
