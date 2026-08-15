import axios from 'axios';
import { IG_CONFIG } from '../config.js';

const BASE = IG_CONFIG.BASE_URL;
const IG_ID = IG_CONFIG.INSTAGRAM_ACCOUNT_ID;

const api = axios.create({ baseURL: BASE });

// ─── Profile ──────────────────────────────────────────────────────────────────
export const fetchProfile = async (token) => {
  const { data } = await api.get(`/${IG_ID}`, {
    params: {
      fields: 'id,name,username,biography,followers_count,follows_count,media_count,profile_picture_url,website',
      access_token: token,
    },
  });
  return data;
};

// ─── Posts ────────────────────────────────────────────────────────────────────
export const fetchPosts = async (token, limit = 50) => {
  const { data } = await api.get(`/${IG_ID}/media`, {
    params: {
      fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink,children{media_url}',
      limit,
      access_token: token,
    },
  });
  return data.data || [];
};

// ─── Post Insights ────────────────────────────────────────────────────────────
export const fetchPostInsights = async (token, mediaId, mediaType) => {
  // Instagram recently deprecated 'impressions' in favor of 'views' for all media types
  // 'shares' and 'saved' are now globally supported across all types
  const metrics = 'reach,saved,shares,views';

  try {
    const { data } = await api.get(`/${mediaId}/insights`, {
      params: { metric: metrics, access_token: token },
    });
    const result = {};
    (data.data || []).forEach(m => { result[m.name] = m.values?.[0]?.value ?? m.value ?? 0; });
    return result;
  } catch (err) {
    console.error('Insights error for', mediaId, err?.response?.data || err.message);
    return {};
  }
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const fetchPostComments = async (token, mediaId) => {
  try {
    const { data } = await api.get(`/${mediaId}/comments`, {
      params: {
        fields: 'id,text,username,timestamp,like_count',
        limit: 100,
        access_token: token,
      },
    });
    return data.data || [];
  } catch (err) {
    console.error('Error fetching comments:', err?.response?.data || err.message);
    return [];
  }
};

export const likeComment = async (token, commentId) => {
  try {
    const { data } = await api.post(`/${IG_ID}/likes`, null, {
      params: {
        comment_id: commentId,
        access_token: token,
      },
    });
    return data;
  } catch (err) {
    console.error('Error liking comment:', err?.response?.data || err.message);
    throw err;
  }
};


// ─── Account Insights ─────────────────────────────────────────────────────────
export const fetchAccountInsights = async (token, period = 'day', since, until) => {
  const params = {
    metric: 'reach,impressions,profile_views,follower_count,accounts_engaged',
    period,
    access_token: token,
  };
  if (since) params.since = since;
  if (until) params.until = until;

  try {
    const { data } = await api.get(`/${IG_ID}/insights`, { params });
    return data.data || [];
  } catch {
    return [];
  }
};

// ─── Follower Demographics ────────────────────────────────────────────────────
export const fetchFollowerDemographics = async (token) => {
  try {
    const breakdowns = ['city', 'country', 'age', 'gender'];
    
    const promises = breakdowns.map(b => 
      api.get(`/${IG_ID}/insights`, {
        params: {
          metric: 'follower_demographics',
          period: 'lifetime',
          metric_type: 'total_value',
          breakdown: b,
          access_token: token,
        },
      })
    );
    
    const responses = await Promise.allSettled(promises);
    const demographics = {};
    
    responses.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        const breakdownKey = breakdowns[i];
        const results = res.value.data?.data?.[0]?.total_value?.breakdowns?.[0]?.results || [];
        
        // Map the results array to a key-value object: { "18-24": 50, "25-34": 30 }
        const mapped = {};
        results.forEach(r => {
          mapped[r.dimension_values[0]] = r.value;
        });
        
        demographics[breakdownKey] = mapped;
      } else {
        console.warn(`Failed to fetch demographics for ${breakdowns[i]}:`, res.reason?.response?.data || res.reason);
        demographics[breakdowns[i]] = {};
      }
    });
    
    return demographics;
  } catch (err) {
    console.error('Demographics error:', err);
    return { city: {}, country: {}, age: {}, gender: {} };
  }
};

// ─── Fetch all posts with insights (batched) ──────────────────────────────────
export const fetchPostsWithInsights = async (token) => {
  const posts = await fetchPosts(token, 30);

  const enriched = await Promise.all(
    posts.map(async (post) => {
      const insights = await fetchPostInsights(token, post.id, post.media_type);
      const engagementRate = post.followers_count
        ? ((post.like_count + post.comments_count) / post.followers_count) * 100
        : null;
      return { ...post, insights, engagementRate };
    })
  );

  return enriched;
};

// ─── Online Followers Heatmap (Last 30 Days) ───────────────────────────────────
export const fetchOnlineFollowers = async (token) => {
  try {
    const until = Math.floor(Date.now() / 1000);
    const since = until - (30 * 24 * 60 * 60); // fetch 30 days for robust heatmap
    const { data } = await api.get(`/${IG_ID}/insights`, {
      params: { metric: 'online_followers', period: 'lifetime', since, until, access_token: token }
    });
    return data.data?.[0]?.values || [];
  } catch (err) {
    console.error('Online followers error:', err);
    return [];
  }
};
