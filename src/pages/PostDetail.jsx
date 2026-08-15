import { useParams, useNavigate } from 'react-router-dom';
import { useInstagramData } from '../hooks/useInstagramData';
import MetricCard from '../components/Cards/MetricCard';
import { ArrowLeft, ExternalLink, MessageCircle, Heart, Bookmark, Share2, PlayCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import TopBar from '../components/Layout/TopBar';
import { fetchPostComments, likeComment } from '../services/instagramApi';
import toast from 'react-hot-toast';

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
  const { filteredPosts, profile, accessToken } = useInstagramData();
  
  const post = filteredPosts.find(p => p.id === id);

  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [likingStatus, setLikingStatus] = useState({ active: false, current: 0, total: 0 });

  useEffect(() => {
    if (post && accessToken) {
      setLoadingComments(true);
      fetchPostComments(accessToken, post.id).then(data => {
        setComments(data);
      }).finally(() => {
        setLoadingComments(false);
      });
    }
  }, [post?.id, accessToken]);

  const handleLikeSingle = async (commentId) => {
    try {
      await likeComment(accessToken, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment liked!');
    } catch (err) {
      console.error('Failed to like comment:', err);
      toast.error('Failed to like comment');
    }
  };

  const handleLikeAll = async () => {
    if (comments.length === 0) return;
    
    // Create a stable copy to iterate over so we don't skip items if the array shrinks during the loop
    const commentsToLike = [...comments];
    
    setLikingStatus({ active: true, current: 0, total: commentsToLike.length });
    let successCount = 0;
    
    for (let i = 0; i < commentsToLike.length; i++) {
      const comment = commentsToLike[i];
      try {
        setLikingStatus(prev => ({ ...prev, current: i + 1 }));
        await likeComment(accessToken, comment.id);
        successCount++;
        setComments(prev => prev.filter(c => c.id !== comment.id));
        // Optional: wait a bit between requests to avoid rate limits
        await new Promise(res => setTimeout(res, 300));
      } catch (err) {
        console.error('Failed to like comment', comment.id);
      }
    }
    
    setLikingStatus({ active: false, current: 0, total: 0 });
    toast.success(`Successfully liked ${successCount} comments!`);
  };

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
            <div className="brutal-panel" style={{ padding: 24, background: 'var(--palette-2)' }}>
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

            <div className="brutal-panel" style={{ padding: 32, background: 'var(--palette-5)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#000', marginBottom: 16 }}>Caption</h3>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: '#000', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
                {post.caption || 'No caption.'}
              </p>
              
              <div style={{ marginTop: 32, paddingTop: 32, borderTop: '3px solid #000' }}>
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
            <div className="brutal-panel" style={{ padding: 32, background: 'var(--palette-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 16, color: '#000', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 900, marginBottom: 8 }}>Performance Score</div>
                  <div style={{ fontSize: 56, fontWeight: 900, color: '#000', letterSpacing: '-2px' }}>
                    {engagementRate}% <span style={{ fontSize: 18, color: '#000', fontWeight: 700, letterSpacing: 0 }}>Eng. Rate</span>
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

            <div className="brutal-panel" style={{ padding: 32, background: 'var(--palette-3)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#000', marginBottom: 24 }}>Discovery</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <MetricBox icon={Eye} label="Reach" value={post.insights?.reach} />
                <MetricBox icon={PlayCircle} label="Views" value={post.insights?.views} />
              </div>
            </div>

            <div className="brutal-panel" style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--palette-1)' }}>
              <LiveUptimeCounter timestamp={post.timestamp} />
            </div>
          </motion.div>
        </div>

        {/* Comments Manager */}
        <motion.div variants={item} style={{ marginTop: 40 }}>
          <div className="brutal-panel" style={{ padding: 32, background: 'var(--palette-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: '#000' }}>Comments Manager</h3>
              
              <button 
                className="btn btn-primary" 
                onClick={handleLikeAll}
                disabled={likingStatus.active || comments.length === 0}
                style={{ background: '#000', color: '#fff', border: 'none', boxShadow: 'none' }}
              >
                {likingStatus.active ? `Liking... (${likingStatus.current}/${likingStatus.total})` : `Auto-Like All Comments (${comments.length})`}
              </button>
            </div>

            {loadingComments ? (
              <div style={{ color: '#000', fontWeight: 600 }}>Loading comments...</div>
            ) : comments.length === 0 ? (
              <div style={{ color: '#000', fontWeight: 600 }}>You've liked all the top comments!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ background: '#fff', border: '2px solid #000', padding: 16, borderRadius: 0, boxShadow: '2px 2px 0px #000', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingRight: 16 }}>
                        <span style={{ fontWeight: 900, color: '#000' }}>@{comment.username}</span>
                        <span style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{new Date(comment.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: '#000', fontWeight: 500 }}>{comment.text}</div>
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: '#666' }}>
                        ❤️ {comment.like_count} likes
                      </div>
                    </div>
                    <button 
                      onClick={() => handleLikeSingle(comment.id)}
                      disabled={likingStatus.active}
                      style={{ 
                        background: 'transparent', border: '2px solid #000', borderRadius: 4, 
                        padding: '6px 12px', cursor: 'pointer', fontWeight: 900, fontSize: 12,
                        boxShadow: '2px 2px 0px #000', transition: 'transform 0.1s'
                      }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px, 2px)'; e.currentTarget.style.boxShadow = 'none'; }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '2px 2px 0px #000'; }}
                    >
                      Like
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value }) {
  return (
    <div style={{ background: '#fff', border: '3px solid #000', borderRadius: '0', padding: 24, boxShadow: '4px 4px 0px #000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#000', marginBottom: 12 }}>
        <Icon size={20} strokeWidth={3} />
        <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#000', letterSpacing: '-1px' }}>
        {value?.toLocaleString() || '0'}
      </div>
    </div>
  );
}

function LiveUptimeCounter({ timestamp }) {
  const [timePassed, setTimePassed] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      if (!timestamp) return;
      const now = new Date();
      const past = new Date(timestamp);
      const diff = now - past;
      if (diff < 0) return setTimePassed('00:00:00:00');
      
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      const pad = (num) => num.toString().padStart(2, '0');
      setTimePassed(`${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`);
    };
    
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#000', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 800, marginBottom: 12 }}>Time Since Upload</div>
      <div style={{ fontSize: 56, fontWeight: 900, color: '#000', letterSpacing: '-2px', fontFamily: 'var(--font-mono)' }}>
        {timePassed}
      </div>
    </div>
  );
}
