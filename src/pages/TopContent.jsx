import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstagramData } from '../hooks/useInstagramData';
import { ExternalLink, X, ArrowRight, Heart, MessageCircle, Image as ImageIcon, PlayCircle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';

const SORT_OPTIONS = [
  { value: 'likes', label: 'Most Likes' },
  { value: 'comments', label: 'Most Comments' },
  { value: 'saves', label: 'Most Saves' },
  { value: 'views', label: 'Most Views' },
  { value: 'er', label: 'Highest ER' },
  { value: 'recent', label: 'Most Recent' },
];

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All Content' },
  { value: 'IMAGE', label: 'Photos' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'REEL', label: 'Reels' },
  { value: 'CAROUSEL_ALBUM', label: 'Carousels' },
];

const TYPE_ICON = {
  IMAGE: <ImageIcon size={14} />,
  VIDEO: <PlayCircle size={14} />,
  REEL: <PlayCircle size={14} />,
  CAROUSEL_ALBUM: <Layers size={14} />,
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const item = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function TopContent() {
  const navigate = useNavigate();
  const { filteredPosts, profile, loading } = useInstagramData();
  const [sort, setSort] = useState('likes');
  const [filter, setFilter] = useState('ALL');
  const [activePost, setActivePost] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sortedPosts = filteredPosts
    .filter(p => filter === 'ALL' || p.media_type === filter)
    .slice()
    .sort((a, b) => {
      if (sort === 'likes') return (b.like_count || 0) - (a.like_count || 0);
      if (sort === 'comments') return (b.comments_count || 0) - (a.comments_count || 0);
      if (sort === 'saves') return (b.insights?.saved || 0) - (a.insights?.saved || 0);
      if (sort === 'views') return (b.insights?.views || 0) - (a.insights?.views || 0);
      if (sort === 'recent') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sort === 'er') {
        const fc = profile?.followers_count || 1;
        const erA = ((a.like_count || 0) + (a.comments_count || 0)) / fc;
        const erB = ((b.like_count || 0) + (b.comments_count || 0)) / fc;
        return erB - erA;
      }
      return 0;
    });

  const SafeCountUp = CountUp.default || CountUp;

  return (
    <div>
      <motion.div className="page-container">
        
        {/* Controls */}
        <div className="clay-panel" style={{ padding: '24px 32px', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, overflow: 'visible' }}>
          <div className="range-tabs">
            {FILTER_OPTIONS.map(o => (
              <button key={o.value} className={`range-tab${filter === o.value ? ' active' : ''}`} onClick={() => setFilter(o.value)}>
                {filter === o.value && (
                  <motion.div layoutId="contentFilterRange" className="range-tab-bg" />
                )}
                {o.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="input-label" style={{ marginBottom: 0 }}>Sort By</span>
            
            {/* Custom Neumorphic Dropdown */}
            <div style={{ position: 'relative', width: 200 }}>
              <button 
                className="select-field" 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', padding: '12px 20px', boxShadow: dropdownOpen ? 'var(--neu-inner)' : 'var(--neu-inner-sm)' }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <motion.div animate={{ rotate: dropdownOpen ? 180 : 0 }}><ArrowRight size={16} style={{ transform: 'rotate(90deg)' }} /></motion.div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{ 
                        position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', 
                        background: 'var(--bg-base)', borderRadius: 'var(--r-md)', 
                        boxShadow: 'var(--neu-drop)', zIndex: 100, overflow: 'hidden',
                        padding: 8
                      }}
                    >
                      {SORT_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          onClick={() => { setSort(o.value); setDropdownOpen(false); }}
                          style={{
                            width: '100%', padding: '12px 16px', textAlign: 'left', 
                            background: sort === o.value ? 'rgba(92, 107, 250, 0.1)' : 'transparent',
                            color: sort === o.value ? 'var(--accent-color)' : 'var(--text-primary)',
                            border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                            fontFamily: 'inherit', fontSize: 15, fontWeight: sort === o.value ? 800 : 600,
                            transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                          onMouseEnter={e => { if(sort !== o.value) e.currentTarget.style.background = 'rgba(184, 198, 218, 0.2)'; }}
                          onMouseLeave={e => { if(sort !== o.value) e.currentTarget.style.background = 'transparent'; }}
                        >
                          {o.label}
                          {sort === o.value && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-color)' }} />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 32, display: 'flex', gap: 16 }}>
          <span>Showing <strong style={{ color: 'var(--text-primary)' }}>{sortedPosts.length}</strong> posts</span>
          <span>·</span>
          <span>Filtered by {FILTER_OPTIONS.find(f => f.value === filter)?.label}</span>
          <span>·</span>
          <span>Sorted by {SORT_OPTIONS.find(s => s.value === sort)?.label}</span>
        </div>

        {loading && !filteredPosts.length ? (
          <div className="post-grid">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '0.8', borderRadius: 'var(--r-lg)' }} />
            ))}
          </div>
        ) : sortedPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-title">No posts found</div>
            <div className="empty-state-text">Try a different filter, or click Sync to fetch your content.</div>
          </div>
        ) : (
          <motion.div 
            className="post-grid"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {sortedPosts.map((post, index) => (
              <motion.div
                key={post.id}
                variants={item}
                className="post-card clay-panel"
                onClick={() => setActivePost(post)}
              >
                <div style={{ position: 'relative' }}>
                  {post.thumbnail_url || post.media_url ? (
                    <img src={post.thumbnail_url || post.media_url} alt="" className="post-thumbnail" />
                  ) : (
                    <div className="post-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {TYPE_ICON[post.media_type] || <ImageIcon size={24} />}
                    </div>
                  )}
                  
                  {/* Rank Badge */}
                  {index < 3 && (
                    <div style={{
                      position: 'absolute', top: 12, left: 12,
                      background: 'var(--bg-base)', color: 'var(--accent-color)', fontWeight: 900, fontSize: 14,
                      width: 32, height: 32, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--neu-drop-sm)'
                    }}>
                      {index + 1}
                    </div>
                  )}
                  
                  {/* Type Badge */}
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--bg-base)', boxShadow: 'var(--neu-drop-sm)',
                    borderRadius: 'var(--r-full)', padding: '6px 12px', fontSize: 11, color: 'var(--text-primary)',
                    fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    {TYPE_ICON[post.media_type]} {post.media_type}
                  </div>
                </div>

                <div className="post-card-body">
                  <div className="post-caption">{post.caption || <em style={{ opacity: 0.3 }}>No caption</em>}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    <div className="post-stats" style={{ gap: 20 }}>
                      <span className="post-stat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Heart size={14} style={{ color: 'var(--danger)' }} fill="var(--danger)" /> 
                        {(post.like_count || 0).toLocaleString()}
                      </span>
                      <span className="post-stat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MessageCircle size={14} style={{ color: 'var(--accent-color)' }} fill="var(--accent-color)" /> 
                        {(post.comments_count || 0).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {new Date(post.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Active Post Modal */}
      <AnimatePresence>
        {activePost && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'var(--glass-blur-heavy)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40
          }} onClick={() => setActivePost(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-panel" 
              style={{ width: '100%', maxWidth: 900, display: 'flex', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ flex: 1, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activePost.thumbnail_url || activePost.media_url ? (
                  <img src={activePost.thumbnail_url || activePost.media_url} alt="" style={{ width: '100%', height: '100%', maxHeight: 600, objectFit: 'contain' }} />
                ) : (
                  <div>{TYPE_ICON[activePost.media_type] || <ImageIcon size={64} />}</div>
                )}
              </div>
              <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Quick Stats</h3>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{new Date(activePost.timestamp).toLocaleString()}</div>
                  </div>
                  <button className="btn btn-icon" onClick={() => setActivePost(null)} style={{ background: 'transparent', boxShadow: 'none' }}>
                    <X size={24} color="var(--text-secondary)" />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Likes</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>
                      <SafeCountUp end={activePost.like_count || 0} duration={1.5} separator="," />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Comments</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>
                      <SafeCountUp end={activePost.comments_count || 0} duration={1.5} separator="," />
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Eng. Rate</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>
                      <SafeCountUp end={profile?.followers_count ? (((activePost.like_count || 0) + (activePost.comments_count || 0)) / profile.followers_count * 100) : 0} duration={1.5} decimals={2} />%
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 16 }}>
                  <button className="btn btn-primary w-full" onClick={() => navigate(`/post/${activePost.id}`)}>
                    View Detailed Report <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
