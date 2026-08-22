import MetricCard from '../components/Cards/MetricCard';
import FollowerGrowthChart from '../components/Charts/FollowerGrowthChart';
import EngagementChart from '../components/Charts/EngagementChart';
import { useInstagramData } from '../hooks/useInstagramData';
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import TopPostOfWeek from '../components/Overview/TopPostOfWeek';
import ContentScoreCard from '../components/Overview/ContentScoreCard';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Overview() {
  const {
    profile, filteredPosts, totals, followerHistory,
    avgEngagementRate, loading, snapshots, refresh
  } = useInstagramData();

  useEffect(() => {
    useAppStore.getState().loadCached();
    if (!profile) refresh();
  }, []);

  const prevFollowers = snapshots.length >= 2 ? snapshots[snapshots.length - 2]?.followers : null;
  const followerDelta = profile && prevFollowers != null ? profile.followers_count - prevFollowers : null;

  return (
    <div>
      <motion.div 
        className="page-container"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* At-a-Glance Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <TopPostOfWeek />
          <ContentScoreCard />
        </div>

        {/* Profile Hero */}
        <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {profile ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32, flex: 1, minWidth: 300 }}>
                {profile.profile_picture_url ? (
                  <div style={{ position: 'relative' }}>
                    <img src={profile.profile_picture_url} alt={profile.name} style={{ width: 100, height: 100, borderRadius: '50%', border: 'var(--brutal-border)', boxShadow: 'var(--brutal-shadow)' }} />
                    <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--palette-3)', border: 'var(--brutal-border)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 900, boxShadow: '2px 2px 0px #000' }}>PRO</div>
                  </div>
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--palette-1)', border: 'var(--brutal-border)', boxShadow: 'var(--brutal-shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 900, color: '#000' }}>
                    {profile.name?.charAt(0) || profile.username?.charAt(0) || '@'}
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: 'var(--text-primary)', textTransform: 'uppercase', lineHeight: 1 }}>
                      {profile.name || profile.username}
                    </div>
                    <div style={{ background: 'var(--palette-2)', padding: '4px 10px', border: 'var(--brutal-border)', borderRadius: 20, fontSize: 11, fontWeight: 800, boxShadow: '2px 2px 0px #000', color: '#000' }}>
                      CREATOR
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
                    @{profile.username}
                  </div>
                  
                  {/* Brutalist Stats Row */}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '6px 12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>POSTS</span>
                      <span style={{ color: 'var(--text-primary)' }}>{profile.media_count?.toLocaleString() || 0}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '6px 12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>FOLLOWING</span>
                      <span style={{ color: 'var(--text-primary)' }}>{profile.follows_count?.toLocaleString() || 0}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '6px 12px', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>ID</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{profile.id?.slice(-6) || '8X9F2'}</span>
                    </div>
                  </div>

                  {profile.biography && (
                    <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, maxWidth: 600, marginTop: 16, borderLeft: '4px solid var(--palette-4)', paddingLeft: 12, fontWeight: 600 }}>
                      {profile.biography}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                {/* Decorative Barcode */}
                <div style={{ display: 'flex', gap: 3, height: 36, opacity: 0.15 }}>
                  {[4, 2, 6, 1, 3, 8, 2, 5, 2, 1, 4, 3, 2, 5].map((w, i) => (
                    <div key={i} style={{ width: w * 2, background: 'var(--text-primary)', height: '100%' }} />
                  ))}
                </div>
                
                <a href={`https://instagram.com/${profile.username}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '16px 32px' }}>
                  Open Instagram <ArrowUpRight size={18} />
                </a>
              </div>
            </>
          ) : (
            <div style={{ width: '100%', height: 100 }} className="skeleton" />
          )}
        </motion.div>

        {/* Top Metrics Row */}
        <motion.div className="metrics-grid">
          <motion.div variants={item}>
            <MetricCard label="Total Followers" value={profile?.followers_count} delta={followerDelta} loading={loading && !profile} />
          </motion.div>
          <motion.div variants={item}>
            <MetricCard label="Avg Engagement Rate" value={avgEngagementRate} suffix="%" loading={loading && !profile} />
          </motion.div>
          <motion.div variants={item}>
            <MetricCard label="Total Reach" value={totals.reach} loading={loading && !profile} />
          </motion.div>
          <motion.div variants={item}>
            <MetricCard label="Total Views" value={totals.views} loading={loading && !profile} />
          </motion.div>
        </motion.div>

        {/* Charts Row */}
        <motion.div className="charts-grid">
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Growth Trajectory</div>
                <div className="chart-subtitle">{snapshots.length} data points tracked over time</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <FollowerGrowthChart data={followerHistory} loading={loading && !snapshots.length} />
            </div>
          </motion.div>

          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Engagement Matrix</div>
                <div className="chart-subtitle">Likes, comments, saves across recent content</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <EngagementChart posts={filteredPosts} loading={loading && !filteredPosts.length} />
            </div>
          </motion.div>
        </motion.div>

        {/* Secondary Metrics Row */}
        <motion.div className="metrics-grid alt-colors-1">
          {[
            { label: 'Total Likes', value: totals.likes },
            { label: 'Comments', value: totals.comments },
            { label: 'Saves', value: totals.saves },
            { label: 'Shares', value: totals.shares },
          ].map((m, i) => (
             <motion.div variants={item} key={m.label}>
               <MetricCard label={m.label} value={m.value} loading={loading && !profile} />
             </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </div>
  );
}
