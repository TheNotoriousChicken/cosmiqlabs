import TopBar from '../components/Layout/TopBar';
import FollowerGrowthChart from '../components/Charts/FollowerGrowthChart';
import { useInstagramData } from '../hooks/useInstagramData';
import { useAppStore } from '../store/useAppStore';
import { Trash2 } from 'lucide-react';
import GoalTracker from '../components/Analytics/GoalTracker';
import { motion } from 'framer-motion';

const MILESTONES = [100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function FollowerAnalytics() {
  const { profile, followerHistory, snapshots, loading } = useInstagramData();
  const { deleteSnapshot } = useAppStore();

  const current = profile?.followers_count ?? 0;

  const netChange7d = (() => {
    if (snapshots.length < 2) return null;
    const recent = snapshots.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const now = recent[0];
    const week = recent.find(s => {
      const diff = (new Date(now.timestamp) - new Date(s.timestamp)) / 86400000;
      return diff >= 7;
    });
    return week ? now.followers - week.followers : null;
  })();

  const nextMilestone = MILESTONES.find(m => m > current);
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= current);
  const milestoneProgress = nextMilestone && prevMilestone
    ? ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : 100;

  return (
    <div>
      <TopBar title="Follower Analytics" subtitle="Deep dive into your audience growth" />
      <motion.div 
        className="page-container"
        variants={container}
        initial="hidden"
        animate="show"
      >
        
        {/* Goal Tracker Widget */}
        <div style={{ marginBottom: 32 }}>
          <GoalTracker />
        </div>

        <div className="metrics-grid">
          {/* Quick Stats */}
          <motion.div variants={item} className="glass-panel metric-card">
            <div className="metric-label">Current Followers</div>
            <div className="metric-value">{current.toLocaleString()}</div>
          </motion.div>
          
          <motion.div variants={item} className="glass-panel metric-card">
            <div className="metric-label">7-Day Change</div>
            <div className="metric-value" style={{ color: netChange7d > 0 ? 'var(--success)' : netChange7d < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {netChange7d !== null ? (netChange7d > 0 ? `+${netChange7d}` : netChange7d) : '—'}
            </div>
          </motion.div>
        </div>

        <motion.div variants={item} className="full-width-card glass-panel chart-card" style={{ padding: '40px' }}>
          <div className="chart-header">
            <div>
              <div className="chart-title">Growth Trajectory</div>
              <div className="chart-subtitle">{snapshots.length} total snapshots</div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <FollowerGrowthChart data={followerHistory} loading={loading && !snapshots.length} />
          </div>
        </motion.div>

        {/* Table */}
        {snapshots.length > 0 && (
          <motion.div variants={item} className="full-width-card glass-panel" style={{ padding: '40px' }}>
            <div className="chart-header" style={{ marginBottom: 32 }}>
              <div className="chart-title">Snapshot Ledger</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Timestamp</th>
                    <th>Followers</th>
                    <th>Net Change</th>
                    <th>Origin</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots
                    .slice()
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .map((snap, i, arr) => {
                      const prev = arr[i + 1];
                      const delta = prev ? snap.followers_count - prev.followers_count : null;
                      return (
                        <tr key={snap.id}>
                          <td style={{ color: 'var(--text-muted)' }}>{(snapshots.length - i).toString().padStart(3, '0')}</td>
                          <td>{new Date(snap.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                          <td style={{ fontWeight: 800, fontSize: 16 }}>{snap.followers_count?.toLocaleString()}</td>
                          <td>
                            {delta !== null ? (
                              <span style={{ color: delta > 0 ? 'var(--success)' : delta < 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 800 }}>
                                {delta > 0 ? '+' : ''}{delta}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td>
                            <span className={`badge ${snap.source === 'auto' ? 'badge-live' : 'badge-manual'}`}>
                              {snap.source === 'auto' ? 'LIVE' : 'MANUAL'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-icon" onClick={() => deleteSnapshot(snap.id)} title="Delete">
                              <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
