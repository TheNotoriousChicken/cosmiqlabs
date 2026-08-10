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
    if (!accessToken) {
      if (!silent) toast.error('No access token. Go to Settings to add one.');
      return;
    }
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      // 1. Fetch fresh data from Instagram API
      const [profileData, postsData, insightsData, demoData] = await Promise.all([
        fetchProfile(accessToken),
        fetchPostsWithInsights(accessToken),
        fetchAccountInsights(accessToken),
        fetchFollowerDemographics(accessToken),
      ]);

      // 2. Upsert user into Supabase, get the db user record back
      const dbUser = await upsertUser(profileData, accessToken);

      // 3. Save today's follower snapshot to DB (one per day)
      await saveSnapshot(dbUser.id, profileData.followers_count, profileData.media_count);

      // 4. Upsert posts and their insights into Supabase
      await upsertPostsAndInsights(dbUser.id, postsData);
      
      // 4.5. Upsert demographics
      await upsertDemographics(dbUser.id, demoData);

      // 5. Load full enriched posts back from DB (with latest insights)
      const dbPosts = await loadPostsFromDB(dbUser.id);

      // 6. Load snapshots and demographics from DB
      const dbSnapshots = await loadSnapshotsFromDB(dbUser.id);
      const dbDemographics = await loadDemographicsFromDB(dbUser.id);

      // 7. Update zustand state from DB data
      setProfile(profileData);
      setPosts(dbPosts);
      setAccountInsights(insightsData);
      setSnapshots(dbSnapshots);
      setDemographics(dbDemographics);
      setDbUserId(dbUser.id);
      markFetched();

      if (!silent) toast.success('Data synced to database!');
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message || 'Failed to fetch data';
      if (!silent) {
        setError(msg);
        toast.error(`Error: ${msg}`);
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
      views: acc.views + (p.insights?.views || 0),
      saves: acc.saves + (p.insights?.saved || 0),
      shares: acc.shares + (p.insights?.shares || 0),
    }),
    { likes: 0, comments: 0, reach: 0, views: 0, saves: 0, shares: 0 }
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
