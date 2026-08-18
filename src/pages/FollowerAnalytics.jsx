import FollowerGrowthChart from '../components/Charts/FollowerGrowthChart';
import { useInstagramData } from '../hooks/useInstagramData';
import { useAppStore } from '../store/useAppStore';
import { Trash2, Sparkles, Loader2, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GoalTracker from '../components/Analytics/GoalTracker';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { detectFollowerAnomalies } from '../services/geminiApi';

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
  const { profile, followerHistory, snapshots, filteredPosts, loading } = useInstagramData();
  const { deleteSnapshot } = useAppStore();
  const [anomalies, setAnomalies] = useState(null);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);

  const current = profile?.followers_count ?? 0;

  const netChange7d = (() => {
    if (snapshots.length < 2) return null;
    const recent = snapshots.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const now = recent[0];
    const week = recent.find(s => {
      const diff = (new Date(now.timestamp) - new Date(s.timestamp)) / 86400000;
      return diff >= 7;
    });
    return week ? now.followers_count - week.followers_count : null;
  })();

  const nextMilestone = MILESTONES.find(m => m > current);
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= current);
  const milestoneProgress = nextMilestone && prevMilestone
    ? ((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : 100;

  const handleDetectAnomalies = async () => {
    setLoadingAnomalies(true);
    try {
      const timeline = snapshots.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(s => ({ date: s.timestamp, followers: s.followers_count }));
      const result = await detectFollowerAnomalies(timeline, filteredPosts);
      setAnomalies(result);
    } catch (e) {
      setAnomalies([]);
    } finally {
      setLoadingAnomalies(false);
    }
  };

  return (
    <div>
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

        <div className="metrics-grid alt-colors-1">
          {/* Quick Stats */}
          <motion.div variants={item} className="brutal-panel metric-card">
            <div className="metric-label">Current Followers</div>
            <div className="metric-value">{current.toLocaleString()}</div>
          </motion.div>
          
          <motion.div variants={item} className="brutal-panel metric-card">
            <div className="metric-label">7-Day Change</div>
            <div className="metric-value" style={{ color: netChange7d > 0 ? 'var(--success)' : netChange7d < 0 ? 'var(--danger)' : 'var(--text-primary)' }}>
              {netChange7d !== null ? (netChange7d > 0 ? `+${netChange7d}` : netChange7d) : '—'}
            </div>
          </motion.div>
        </div>

        <motion.div variants={item} className="full-width-card brutal-panel chart-card" style={{ padding: '40px' }}>
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
          <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: '40px' }}>
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

        {/* AI Anomaly Detector */}
        <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: anomalies ? 24 : 0 }}>
            <div>
              <div className="chart-title">AI Growth Anomaly Detector</div>
              <div className="chart-subtitle">Detects unusual spikes or drops and diagnoses the cause</div>
            </div>
            <button
              onClick={handleDetectAnomalies}
              disabled={loadingAnomalies || snapshots.length < 2}
              style={{
                padding: '10px 20px', background: loadingAnomalies ? '#ccc' : 'var(--palette-2)',
                border: '2px solid #000', boxShadow: loadingAnomalies ? 'none' : '3px 3px 0 #000',
                fontWeight: 900, fontSize: 12, textTransform: 'uppercase', cursor: loadingAnomalies || snapshots.length < 2 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
              }}
            >
              {loadingAnomalies ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Scanning...</> : <><Sparkles size={14} /> Run Analysis</>}
            </button>
          </div>
          {anomalies === null && !loadingAnomalies && (
            <div style={{ padding: '12px 0', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
              {snapshots.length < 2 ? 'Sync more data snapshots to enable anomaly detection.' : 'Click Run Analysis to scan your follower growth for unusual patterns.'}
            </div>
          )}
          {anomalies !== null && !loadingAnomalies && (
            anomalies.length === 0 ? (
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>✓ No significant anomalies detected. Growth looks stable.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {anomalies.map((a, i) => {
                  const color = a.type === 'spike' ? 'var(--success)' : a.type === 'drop' ? 'var(--danger)' : 'var(--text-secondary)';
                  const Icon = a.type === 'spike' ? TrendingUp : a.type === 'drop' ? TrendingDown : Minus;
                  return (
                    <div key={i} style={{ padding: 18, border: '2px solid #000', boxShadow: '3px 3px 0 #000', background: '#fafafa', display: 'flex', gap: 14 }}>
                      <Icon size={20} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>{a.magnitude} <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>· {new Date(a.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span></div>
                        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>{a.likely_cause}</div>
                        {a.correlated_post && <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 4 }}>Correlated post: "{a.correlated_post}"</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
