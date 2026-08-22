import { useInstagramData } from '../../hooks/useInstagramData';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, Eye, ArrowRight, Trophy } from 'lucide-react';

export default function TopPostOfWeek() {
  const { filteredPosts, profile } = useInstagramData();
  const navigate = useNavigate();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekPosts = filteredPosts.filter(p => new Date(p.timestamp) >= oneWeekAgo);
  const pool = weekPosts.length > 0 ? weekPosts : filteredPosts.slice(0, 10);

  if (!pool.length) return null;

  const scored = pool.map(p => ({
    ...p,
    score: (p.like_count || 0) + (p.comments_count || 0) * 3 + (p.insights?.saved || 0) * 5 + (p.insights?.views || 0) * 0.01,
  }));
  const top = scored.reduce((a, b) => (a.score > b.score ? a : b));

  const fc = profile?.followers_count || 1;
  const er = (((top.like_count || 0) + (top.comments_count || 0)) / fc * 100).toFixed(2);
  const thumbnail = top.thumbnail_url || top.media_url;
  const isWeek = weekPosts.length > 0;

  const stats = [
    { icon: Heart,         label: 'Likes',    value: top.like_count || 0,        color: '#ff4d6d' },
    { icon: MessageCircle, label: 'Comments', value: top.comments_count || 0,    color: 'var(--accent-color)' },
    { icon: Bookmark,      label: 'Saves',    value: top.insights?.saved || 0,   color: '#8c52ff' },
    { icon: Eye,           label: 'Views',    value: top.insights?.views || 0,   color: '#00b4d8' },
  ];

  return (
    <motion.div className="full-width-card brutal-panel" style={{ padding: 0, overflow: 'hidden' }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div style={{ padding: '14px 28px', background: 'var(--palette-1)', borderBottom: '3px solid #000', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Trophy size={17} strokeWidth={2.5} />
        <span style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
          {isWeek ? 'Top Post This Week' : 'Your Best Post'}
        </span>
        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 11, opacity: 0.6, textTransform: 'uppercase' }}>
          {new Date(top.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          {' · '}{top.media_type}
        </span>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={{ width: 160, flexShrink: 0, background: '#111', borderRight: '3px solid #000', minHeight: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {thumbnail
            ? <img src={thumbnail} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
            : <span style={{ fontSize: 40 }}>{top.media_type === 'VIDEO' || top.media_type === 'REEL' ? '🎥' : '📷'}</span>}
        </div>

        <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {top.caption || <em style={{ opacity: 0.4 }}>No caption</em>}
          </div>

          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={13} color={color} fill={color} />
                <span style={{ fontWeight: 900, fontSize: 15 }}>{value.toLocaleString()}</span>
                <span style={{ fontWeight: 600, fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', padding: '6px 14px', background: 'var(--palette-2)', border: '2px solid #000', boxShadow: '3px 3px 0 #000', fontWeight: 900, fontSize: 14 }}>
              {er}% ER
            </div>
          </div>

          <button onClick={() => navigate(`/post/${top.id}`)}
            style={{ alignSelf: 'flex-start', padding: '8px 18px', background: '#000', color: '#fff', border: '2px solid #000', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.5, fontFamily: 'inherit' }}>
            Full Analysis <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
