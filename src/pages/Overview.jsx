import MetricCard from '../components/Cards/MetricCard';
import FollowerGrowthChart from '../components/Charts/FollowerGrowthChart';
import EngagementChart from '../components/Charts/EngagementChart';
import { useInstagramData } from '../hooks/useInstagramData';
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

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
        {/* Profile Hero */}
        <motion.div variants={item} className="full-width-card clay-panel" style={{ padding: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {profile ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                {profile.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt={profile.name} style={{ width: 100, height: 100, borderRadius: '50%', boxShadow: 'var(--neu-drop)' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-base)', boxShadow: 'var(--neu-drop)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800 }}>
                    {profile.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', marginBottom: 8, color: 'var(--text-primary)' }}>{profile.name}</div>
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 12 }}>@{profile.username}</div>
                  {profile.biography && (
                    <div style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.6, maxWidth: 600 }}>
                      {profile.biography}
                    </div>
                  )}
                </div>
              </div>
              <div>
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
            <MetricCard label="Total Impressions" value={totals.impressions} loading={loading && !profile} />
          </motion.div>
        </motion.div>

        {/* Charts Row */}
        <motion.div className="charts-grid">
          <motion.div variants={item} className="clay-panel chart-card">
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

          <motion.div variants={item} className="clay-panel chart-card">
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
        <motion.div className="metrics-grid">
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
