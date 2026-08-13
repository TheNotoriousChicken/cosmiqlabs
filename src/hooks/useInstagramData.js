import { useAppStore } from '../store/useAppStore';
import { fetchProfile, fetchPostsWithInsights, fetchAccountInsights, fetchFollowerDemographics } from '../services/instagramApi';
import { upsertUser, upsertPostsAndInsights, saveSnapshot, loadPostsFromDB, loadSnapshotsFromDB, upsertDemographics, loadDemographicsFromDB } from '../lib/db';
import toast from 'react-hot-toast';

export const useInstagramData = () => {
  const {
    accessToken, mode, profile, posts, accountInsights, snapshots, demographics,
    loading, error, lastFetch, activeRange,
    setProfile, setPosts, setAccountInsights, setLoading, setError,
    setSnapshots, setDemographics, markFetched, setDbUserId, dbUserId,
  } = useAppStore();

  const refresh = async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      // 1. Trigger the Vercel backend to sync directly with Instagram
      const response = await fetch('/api/sync', { method: 'POST' });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Failed to trigger background sync.');
      }

      // 2. Reload the fresh data from the Database
      await loadFromDB();
      markFetched();

      if (!silent) toast.success('Data synced successfully!');
    } catch (err) {
      const msg = err.message || 'Failed to sync data';
      if (!silent) {
        setError(msg);
        toast.error(`Sync Error: ${msg}`);
      }
      console.error('Refresh error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial load from DB (fast, no API call needed)
  const loadFromDB = async () => {
    const currentDbUserId = useAppStore.getState().dbUserId;
    if (!currentDbUserId) return;
    try {
      const [dbPosts, dbSnapshots, dbDemographics, dbUser] = await Promise.all([
        loadPostsFromDB(currentDbUserId),
        loadSnapshotsFromDB(currentDbUserId),
        loadDemographicsFromDB(currentDbUserId),
        import('../lib/db').then(m => m.getUserByIgId('17841410004708818')),
      ]);
      setPosts(dbPosts);
      setSnapshots(dbSnapshots);
      setDemographics(dbDemographics);
      if (dbUser) setProfile(dbUser);
    } catch (err) {
      console.error('DB load error:', err);
    }
  };

  // Follower history derived from snapshots
  const followerHistory = [...snapshots]
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .map((s, i, arr) => ({
      ...s,
      followers: s.followers_count, // normalize db field name
      delta: i > 0 ? s.followers_count - arr[i - 1].followers_count : 0,
      date: new Date(s.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    }));

  // Filter posts by range
  const filterByRange = (items, field = 'timestamp') => {
    const now = new Date();
    const days = activeRange === '7d' ? 7 : activeRange === '30d' ? 30 : activeRange === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return items.filter(item => new Date(item[field]) >= cutoff);
  };

  const filteredPosts = filterByRange(posts);

  // Aggregate stats from posts
  const totals = filteredPosts.reduce(
    (acc, p) => ({
      likes: acc.likes + (p.like_count || 0),
      comments: acc.comments + (p.comments_count || 0),
      reach: acc.reach + (p.insights?.reach || 0),
      impressions: acc.impressions + (p.insights?.impressions || 0),
      views: acc.views + (p.insights?.views || 0),
      saves: acc.saves + (p.insights?.saved || 0),
      shares: acc.shares + (p.insights?.shares || 0),
    }),
    { likes: 0, comments: 0, reach: 0, impressions: 0, views: 0, saves: 0, shares: 0 }
  );

  const avgEngagementRate =
    filteredPosts.length > 0 && profile?.followers_count
      ? ((totals.likes + totals.comments) / filteredPosts.length / profile.followers_count) * 100
      : 0;

  return {
    profile, posts, filteredPosts, accountInsights, snapshots, demographics,
    followerHistory, totals, avgEngagementRate,
    loading, error, lastFetch, activeRange,
    accessToken, mode,
    refresh, loadFromDB,
  };
};
