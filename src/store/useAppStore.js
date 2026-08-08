import { create } from 'zustand';
import { STORAGE_KEYS } from '../config';

const loadFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const useAppStore = create((set, get) => ({
  // Auth / Mode
  accessToken: localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || '',
  mode: localStorage.getItem(STORAGE_KEYS.MODE) || 'live',

  // DB State
  dbUserId: localStorage.getItem('db_user_id') || null,

  // Data
  profile: null,
  posts: [],
  accountInsights: null,
  snapshots: [],
  demographics: null,

  // UI
  loading: false,
  error: null,
  lastFetch: localStorage.getItem(STORAGE_KEYS.LAST_FETCH) || null,
  activeRange: '30d',

  // ──────────────────────────────────────────
  // ACTIONS
  // ──────────────────────────────────────────

  setAccessToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    set({ accessToken: token });
  },

  setMode: (mode) => {
    localStorage.setItem(STORAGE_KEYS.MODE, mode);
    set({ mode });
  },

  setProfile: (profile) => set({ profile }),

  setPosts: (posts) => {
    set({ posts });
  },

  setAccountInsights: (insights) => {
    set({ accountInsights: insights });
  },

  setSnapshots: (snapshots) => set({ snapshots }),
  
  setDemographics: (demographics) => set({ demographics }),

  setDbUserId: (id) => {
    localStorage.setItem('db_user_id', id);
    set({ dbUserId: id });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveRange: (range) => set({ activeRange: range }),

  markFetched: () => {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_FETCH, now);
    set({ lastFetch: now });
  },

  // Legacy snapshot methods (kept for compatibility)
  addSnapshot: (snapshot) => {
    const current = get().snapshots;
    const updated = [...current, { ...snapshot, id: Date.now(), timestamp: new Date().toISOString() }];
    set({ snapshots: updated });
  },

  deleteSnapshot: (id) => {
    const updated = get().snapshots.filter(s => s.id !== id);
    set({ snapshots: updated });
  },

  clearSnapshots: () => {
    set({ snapshots: [] });
  },

  // Load cached data on startup (kept for backward compat)
  loadCached: () => {
    const cachedPosts = loadFromStorage(STORAGE_KEYS.POSTS_CACHE, []);
    const cachedInsights = loadFromStorage(STORAGE_KEYS.INSIGHTS_CACHE, null);
    // Only use cached posts if posts is empty (DB hasn't loaded yet)
    const currentPosts = get().posts;
    if (currentPosts.length === 0 && cachedPosts.length > 0) {
      set({ posts: cachedPosts, accountInsights: cachedInsights });
    }
  },
}));
