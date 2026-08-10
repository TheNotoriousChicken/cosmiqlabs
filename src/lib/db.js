import { supabase } from './supabase.js';

const IG_USER_ID = '17841410004708818'; // Hardcoded IG user ID

// ─── Upsert user record, return db user ────────────────────────────────────
export const upsertUser = async (profileData, accessToken) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        ig_user_id: profileData.id || IG_USER_ID,
        username: profileData.username,
        access_token: accessToken,
        followers_count: profileData.followers_count,
        media_count: profileData.media_count,
        profile_picture_url: profileData.profile_picture_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'ig_user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── Save follower snapshot ─────────────────────────────────────────────────
export const saveSnapshot = async (userId, followersCount, mediaCount) => {
  // Only save one snapshot per day
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabase
    .from('account_snapshots')
    .select('id')
    .eq('user_id', userId)
    .gte('timestamp', today)
    .limit(1);

  if (existing && existing.length > 0) return; // Already snapshotted today

  await supabase.from('account_snapshots').insert({
    user_id: userId,
    followers_count: followersCount,
    media_count: mediaCount,
    source: 'auto',
  });
};

// ─── Upsert posts + insert post insights ───────────────────────────────────
export const upsertPostsAndInsights = async (userId, posts) => {
  if (!posts || posts.length === 0) return;

  // Upsert posts (core data)
  const postRows = posts.map((p) => ({
    id: p.id,
    user_id: userId,
    media_type: p.media_type,
    media_product_type: p.media_product_type || null,
    caption: p.caption || null,
    media_url: p.media_url || null,
    thumbnail_url: p.thumbnail_url || null,
    permalink: p.permalink || null,
    like_count: p.like_count || 0,
    comments_count: p.comments_count || 0,
    posted_at: p.timestamp || null,
    updated_at: new Date().toISOString(),
  }));

  const { error: postsError } = await supabase
    .from('posts')
    .upsert(postRows, { onConflict: 'id' });

  if (postsError) throw postsError;

  // Insert new insight snapshot row (we keep history, so always insert)
  const insightRows = posts
    .filter((p) => p.insights && Object.keys(p.insights).length > 0)
    .map((p) => ({
      post_id: p.id,
      user_id: userId,
      reach: p.insights.reach || 0,
      views: p.insights.views || 0,
      saves: p.insights.saved || 0,
      shares: p.insights.shares || 0,
    }));

  if (insightRows.length > 0) {
    const { error: insightsError } = await supabase
      .from('post_insights')
      .insert(insightRows);
    if (insightsError) throw insightsError;
  }
};

// ─── Load posts with latest insights from DB ──────────────────────────────
export const loadPostsFromDB = async (userId) => {
  // Get all posts for this user
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId)
    .order('posted_at', { ascending: false });

  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  // For each post, grab the latest insight row
  const postIds = posts.map((p) => p.id);
  const { data: allInsights } = await supabase
    .from('post_insights')
    .select('*')
    .in('post_id', postIds)
    .order('fetched_at', { ascending: false });

  // Map latest insight per post
  const latestInsightMap = {};
  (allInsights || []).forEach((ins) => {
    if (!latestInsightMap[ins.post_id]) {
      latestInsightMap[ins.post_id] = ins;
    }
  });

  return posts.map((p) => {
    const ins = latestInsightMap[p.id];
    return {
      ...p,
      timestamp: p.posted_at,
      insights: ins
        ? { reach: ins.reach, views: ins.views, saved: ins.saves, shares: ins.shares }
        : {},
    };
  });
};

// ─── Load snapshots from DB ──────────────────────────────────────────────
export const loadSnapshotsFromDB = async (userId) => {
  const { data, error } = await supabase
    .from('account_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });

  if (error) throw error;
  return data || [];
};

// ─── Get user by IG user ID ──────────────────────────────────────────────
export const getUserByIgId = async (igUserId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('ig_user_id', igUserId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data || null;
};

// ─── Save Demographics ───────────────────────────────────────────────────
export const upsertDemographics = async (userId, demographics) => {
  const { error } = await supabase.from('audience_demographics').insert({
    user_id: userId,
    demographics,
  });
  if (error) throw error;
};

// ─── Load Latest Demographics ─────────────────────────────────────────────
export const loadDemographicsFromDB = async (userId) => {
  const { data, error } = await supabase
    .from('audience_demographics')
    .select('demographics')
    .eq('user_id', userId)
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.demographics || null;
};
