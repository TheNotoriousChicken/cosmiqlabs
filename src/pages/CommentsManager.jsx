import { useState, useEffect, useCallback } from 'react';
import { useInstagramData } from '../hooks/useInstagramData';
import { useAppStore } from '../store/useAppStore';
import { fetchPostComments, likeComment } from '../services/instagramApi';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Loader2, RefreshCw, MessageCircle, CheckCheck, User, Image } from 'lucide-react';
import toast from 'react-hot-toast';

const POSTS_TO_SCAN = 15; // scan latest N posts for comments

const container = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function CommentsManager() {
  const { filteredPosts } = useInstagramData();
  const { accessToken } = useAppStore();

  // { commentId → { comment, post } }
  const [allComments, setAllComments]     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [likedIds, setLikedIds]           = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('insta_liked_comments') || '[]')); }
    catch { return new Set(); }
  });
  const [likingStatus, setLikingStatus]   = useState({ active: false, current: 0, total: 0 });
  const [sortBy, setSortBy]               = useState('newest'); // 'newest' | 'most_liked'

  // Persist liked ids
  const persistLike = useCallback((id) => {
    setLikedIds(prev => {
      const next = new Set([...prev, id]);
      localStorage.setItem('insta_liked_comments', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const removeComment = (id) => {
    setAllComments(prev => prev.filter(c => c.id !== id));
    persistLike(id);
  };

  // Fetch comments from latest N posts
  const fetchAll = useCallback(async () => {
    if (!accessToken || !filteredPosts.length) return;
    setLoading(true);
    setAllComments([]);

    const posts = filteredPosts.slice(0, POSTS_TO_SCAN);
    const results = [];

    await Promise.allSettled(
      posts.map(async (post) => {
        const comments = await fetchPostComments(accessToken, post.id);
        comments.forEach(c => {
          if (!likedIds.has(c.id)) {
            results.push({ ...c, post });
          }
        });
      })
    );

    // Sort newest first by default
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setAllComments(results);
    setLoading(false);
  }, [accessToken, filteredPosts, likedIds]);

  useEffect(() => {
    fetchAll();
  }, [accessToken]); // only on mount / token change

  // Single like
  const handleLike = async (commentId) => {
    try {
      await likeComment(accessToken, commentId);
      removeComment(commentId);
      toast.success('Comment liked!');
    } catch {
      toast.error('Failed to like comment');
    }
  };

  // Like all visible
  const handleLikeAll = async () => {
    if (!allComments.length) return;
    const toProcess = [...allComments];
    setLikingStatus({ active: true, current: 0, total: toProcess.length });
    let ok = 0;

    for (let i = 0; i < toProcess.length; i++) {
      setLikingStatus(p => ({ ...p, current: i + 1 }));
      try {
        await likeComment(accessToken, toProcess[i].id);
        removeComment(toProcess[i].id);
        ok++;
        await new Promise(r => setTimeout(r, 300));
      } catch {
        console.error('Failed to like', toProcess[i].id);
      }
    }

    setLikingStatus({ active: false, current: 0, total: 0 });
    toast.success(`Liked ${ok} comment${ok !== 1 ? 's' : ''}!`);
  };

  // Sort comments
  const sorted = [...allComments].sort((a, b) => {
    if (sortBy === 'most_liked') return (b.like_count || 0) - (a.like_count || 0);
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const timeAgo = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60)   return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div>
      <motion.div className="page-container" variants={container} initial="hidden" animate="show">

        {/* Header bar */}
        <motion.div variants={item} className="full-width-card brutal-panel"
          style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

          <div style={{ flex: 1 }}>
            <div className="chart-title" style={{ marginBottom: 2 }}>Comments Manager</div>
            <div className="chart-subtitle">
              {loading ? 'Scanning posts…' : `${allComments.length} unactioned comment${allComments.length !== 1 ? 's' : ''} across last ${POSTS_TO_SCAN} posts`}
            </div>
          </div>

          {/* Sort toggle */}
          <div style={{ display: 'flex', gap: 0, border: '2px solid #000', overflow: 'hidden' }}>
            {['newest', 'most_liked'].map(s => (
              <button key={s} onClick={() => setSortBy(s)}
                style={{
                  padding: '8px 14px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: 0.5, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                  background: sortBy === s ? '#000' : '#fff',
                  color:      sortBy === s ? '#fff' : '#000',
                  borderRight: s === 'newest' ? '2px solid #000' : 'none',
                }}>
                {s === 'newest' ? 'Newest' : 'Most Liked'}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button onClick={fetchAll} disabled={loading}
            style={{ padding: '10px 16px', border: '2px solid #000', background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: 12, fontFamily: 'inherit' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          {/* Like All */}
          <button onClick={handleLikeAll}
            disabled={likingStatus.active || !allComments.length || loading}
            style={{
              padding: '10px 20px',
              background: likingStatus.active || !allComments.length ? '#ccc' : 'var(--palette-2)',
              border: '2px solid #000',
              boxShadow: likingStatus.active || !allComments.length ? 'none' : '3px 3px 0 #000',
              fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5,
              cursor: likingStatus.active || !allComments.length ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
            }}>
            {likingStatus.active
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Liking {likingStatus.current}/{likingStatus.total}</>
              : <><CheckCheck size={14} /> Like All ({allComments.length})</>}
          </button>
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 4 }} />
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && allComments.length === 0 && (
          <motion.div variants={item} className="full-width-card brutal-panel"
            style={{ padding: '60px 40px', textAlign: 'center' }}>
            <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
            <div className="chart-title">All caught up</div>
            <div className="chart-subtitle">No unactioned comments across your last {POSTS_TO_SCAN} posts.</div>
          </motion.div>
        )}

        {/* Comments list */}
        {!loading && sorted.length > 0 && (
          <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <AnimatePresence>
              {sorted.map((c, i) => {
                const thumbnail = c.post?.thumbnail_url || c.post?.media_url;
                return (
                  <motion.div key={c.id}
                    initial={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: 'flex', alignItems: 'stretch',
                      borderBottom: i < sorted.length - 1 ? '2px solid #000' : 'none',
                      background: i % 2 === 0 ? '#fafafa' : '#fff',
                    }}>

                    {/* Post thumbnail strip */}
                    <div style={{ width: 56, flexShrink: 0, borderRight: '2px solid #000', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {thumbnail
                        ? <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 72 }} />
                        : <Image size={18} color="#555" />}
                    </div>

                    {/* Comment body */}
                    <div style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <User size={12} />
                          <span style={{ fontWeight: 900, fontSize: 13 }}>@{c.username}</span>
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)' }}>{timeAgo(c.timestamp)}</span>
                        {c.like_count > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, fontSize: 11, color: '#ff4d6d' }}>
                            <Heart size={10} fill="#ff4d6d" /> {c.like_count}
                          </span>
                        )}
                        {/* Post label */}
                        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.post?.caption?.slice(0, 40) || c.post?.media_type || 'Post'}…
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)' }}>
                        {c.text}
                      </div>
                    </div>

                    {/* Like button */}
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderLeft: '2px solid #000', flexShrink: 0 }}>
                      <button onClick={() => handleLike(c.id)}
                        disabled={likingStatus.active}
                        style={{
                          width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '2px solid #000', boxShadow: '2px 2px 0 #000',
                          background: 'var(--palette-2)', cursor: likingStatus.active ? 'not-allowed' : 'pointer',
                        }}>
                        <Heart size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
