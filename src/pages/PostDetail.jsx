import { useParams, useNavigate } from 'react-router-dom';
import { useInstagramData } from '../hooks/useInstagramData';
import TopBar from '../components/Layout/TopBar';
import MetricCard from '../components/Cards/MetricCard';
import { ArrowLeft, ExternalLink, MessageCircle, Heart, Bookmark, Share2, PlayCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { filteredPosts, profile } = useInstagramData();
  
  const post = filteredPosts.find(p => p.id === id);

  if (!post) {
    return (
      <div>
        <TopBar title="Post Details" subtitle="Loading or not found..." />
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <h2>Post not found</h2>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: 24 }}>
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REEL';
  const engagement = (post.like_count || 0) + (post.comments_count || 0) + (post.insights?.saved || 0) + (post.insights?.shares || 0);
  const engagementRate = profile?.followers_count ? ((engagement / profile.followers_count) * 100).toFixed(2) : '0.00';

  return (
    <div>
      <TopBar title="Post Details" subtitle={new Date(post.timestamp).toLocaleString()} />
      <motion.div 
        className="page-container"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div style={{ marginBottom: 40 }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Content
          </button>
        </div>

        <div className="charts-grid">
          {/* Left Column: Media & Caption */}
          <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div className="glass-panel" style={{ padding: 24 }}>
              {post.thumbnail_url || post.media_url ? (
                <img 
                  src={post.thumbnail_url || post.media_url} 
                  alt="Post media" 
                  style={{ width: '100%', borderRadius: 'var(--r-md)', boxShadow: 'var(--neu-inner-sm)', objectFit: 'contain', maxHeight: 600, background: 'black' }} 
                />
              ) : (
                <div style={{ width: '100%', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                  {isVideo ? '🎥' : '📷'}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 16 }}>Caption</h3>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {post.caption || 'No caption.'}
              </p>
              
              <div style={{ marginTop: 32, paddingTop: 32, borderTop: '2px dashed var(--shadow-light)' }}>
                <a 
                  href={post.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                >
                  View on Instagram <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Deep Metrics */}
          <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            <div className="glass-panel" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, marginBottom: 8 }}>Performance Score</div>
                  <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {engagementRate}% <span style={{ fontSize: 16, color: 'var(--text-muted)', fontWeight: 600 }}>Eng. Rate</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <MetricBox icon={Heart} label="Likes" value={post.like_count} />
                <MetricBox icon={MessageCircle} label="Comments" value={post.comments_count} />
                <MetricBox icon={Bookmark} label="Saves" value={post.insights?.saved} />
                <MetricBox icon={Share2} label="Shares" value={post.insights?.shares} />
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', marginBottom: 24 }}>Discovery</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <MetricBox icon={Eye} label="Reach" value={post.insights?.reach} />
                <MetricBox icon={PlayCircle} label="Views" value={post.insights?.views} />
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value }) {
  return (
    <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--r-md)', padding: 24, boxShadow: 'var(--neu-inner-sm)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
        <Icon size={18} />
        <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)' }}>
        {value?.toLocaleString() || '0'}
      </div>
    </div>
  );
}
