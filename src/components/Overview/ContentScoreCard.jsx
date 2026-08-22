import { useInstagramData } from '../../hooks/useInstagramData';
import { motion } from 'framer-motion';
import { BarChart2 } from 'lucide-react';

const TYPE_LABEL = {
  REEL: 'Reels',
  VIDEO: 'Videos',
  IMAGE: 'Photos',
  CAROUSEL_ALBUM: 'Carousels',
};

const TYPE_EMOJI = {
  REEL: '🎬',
  VIDEO: '📹',
  IMAGE: '📷',
  CAROUSEL_ALBUM: '🗂️',
};

const PALETTE = ['var(--palette-1)', 'var(--palette-2)', 'var(--palette-3)', 'var(--palette-4)'];

function verdict(er, maxEr) {
  if (maxEr === 0) return { label: 'No Data', bg: '#eee', color: '#999' };
  const ratio = er / maxEr;
  if (ratio >= 0.75) return { label: '🔥 Hot',      bg: 'var(--palette-2)', color: '#000' };
  if (ratio >= 0.4)  return { label: '✓ Decent',    bg: 'var(--palette-3)', color: '#000' };
  return               { label: '💀 Dead Weight', bg: '#ffe5e5',           color: '#c00' };
}

export default function ContentScoreCard() {
  const { filteredPosts, profile } = useInstagramData();

  if (!filteredPosts.length) return null;

  const fc = profile?.followers_count || 1;

  // Group by type and compute averages
  const groups = {};
  filteredPosts.forEach(p => {
    const t = p.media_type || 'IMAGE';
    if (!groups[t]) groups[t] = { posts: [], totalEr: 0, totalViews: 0, totalLikes: 0, totalSaves: 0 };
    const er = ((p.like_count || 0) + (p.comments_count || 0)) / fc * 100;
    groups[t].posts.push(p);
    groups[t].totalEr    += er;
    groups[t].totalViews += p.insights?.views || 0;
    groups[t].totalLikes += p.like_count || 0;
    groups[t].totalSaves += p.insights?.saved || 0;
  });

  const scores = Object.entries(groups).map(([type, g], i) => {
    const n = g.posts.length;
    return {
      type,
      count: n,
      avgEr:    g.totalEr    / n,
      avgViews: g.totalViews / n,
      avgLikes: g.totalLikes / n,
      avgSaves: g.totalSaves / n,
      palette:  PALETTE[i % PALETTE.length],
    };
  }).sort((a, b) => b.avgEr - a.avgEr);

  const maxEr = scores[0]?.avgEr || 0;

  return (
    <motion.div className="full-width-card brutal-panel" style={{ padding: 0, overflow: 'hidden' }}
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: 0.05 }}
    >
      {/* Header */}
      <div style={{ padding: '14px 28px', background: 'var(--palette-3)', borderBottom: '3px solid #000', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BarChart2 size={17} strokeWidth={2.5} />
        <span style={{ fontWeight: 900, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Content Score Card</span>
        <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 11, opacity: 0.6, textTransform: 'uppercase' }}>
          {filteredPosts.length} posts analysed
        </span>
      </div>

      {/* Scores grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${scores.length}, 1fr)`, borderTop: '3px solid #000' }}>
        {scores.map((s, i) => {
          const v = verdict(s.avgEr, maxEr);
          const barPct = maxEr > 0 ? (s.avgEr / maxEr) * 100 : 0;
          return (
            <div key={s.type} style={{
              padding: '20px 24px',
              borderRight: i < scores.length - 1 ? '3px solid #000' : 'none',
              display: 'flex', flexDirection: 'column', gap: 12,
              background: i === 0 ? '#fafafa' : '#fff',
            }}>
              {/* Type header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 22 }}>{TYPE_EMOJI[s.type] || '📦'}</div>
                  <div style={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                    {TYPE_LABEL[s.type] || s.type}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)' }}>{s.count} posts</div>
                </div>
                <div style={{ padding: '4px 10px', background: v.bg, border: '2px solid #000', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: v.color, whiteSpace: 'nowrap' }}>
                  {v.label}
                </div>
              </div>

              {/* ER bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Avg ER</span>
                  <span style={{ fontWeight: 900, fontSize: 15 }}>{s.avgEr.toFixed(2)}%</span>
                </div>
                <div style={{ height: 6, background: '#eee', border: '1px solid #ccc', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${barPct}%`, height: '100%', background: '#000', borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
              </div>

              {/* Sub stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'Avg Views',  value: Math.round(s.avgViews).toLocaleString() },
                  { label: 'Avg Likes',  value: Math.round(s.avgLikes).toLocaleString() },
                  { label: 'Avg Saves',  value: Math.round(s.avgSaves).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 800 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
