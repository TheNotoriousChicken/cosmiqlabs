import TopBar from '../components/Layout/TopBar';
import EngagementChart from '../components/Charts/EngagementChart';
import EngagementRateChart from '../components/Charts/EngagementRateChart';
import ContentTypePieChart from '../components/Charts/ContentTypePieChart';
import BestTimePredictor from '../components/Analytics/BestTimePredictor';
import { useInstagramData } from '../hooks/useInstagramData';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function EngagementAnalytics() {
  const { filteredPosts, totals, profile, avgEngagementRate, loading } = useInstagramData();

  // Heatmap calculation
  const heatmap = {};
  DAYS.forEach(d => { heatmap[d] = {}; HOURS.forEach(h => { heatmap[d][h] = { posts: 0, likes: 0, comments: 0 }; }); });
  filteredPosts.forEach(p => {
    const d = new Date(p.timestamp);
    const day = DAYS[d.getDay()];
    const hour = d.getHours();
    if (heatmap[day]?.[hour]) {
      heatmap[day][hour].posts += 1;
      heatmap[day][hour].likes += p.like_count || 0;
      heatmap[day][hour].comments += p.comments_count || 0;
    }
  });

  const maxHeatVal = Math.max(...Object.values(heatmap).flatMap(d => Object.values(d).map(h => h.likes + h.comments)));

  const metrics = [
    { label: 'Avg Eng. Rate', value: avgEngagementRate, suffix: '%' },
    { label: 'Total Reach', value: totals.reach },
    { label: 'Total Views', value: totals.views },
    { label: 'Total Saves', value: totals.saves },
  ];

  return (
    <div>
      <TopBar title="Engagement Analysis" subtitle="Deep dive into audience interactions" />
      <motion.div 
        className="page-container"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Quick Metrics */}
        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <motion.div variants={item} key={m.label} className="glass-panel metric-card">
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">
                {(() => { const SafeCountUp = CountUp.default || CountUp; return <SafeCountUp end={m.value} duration={2} separator="," decimals={m.suffix === '%' ? 2 : 0} />; })()}
                {m.suffix}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Charts */}
        <div className="charts-grid">
          <motion.div variants={item} className="glass-panel chart-card">
             <div className="chart-header">
              <div>
                <div className="chart-title">Interaction Timeline</div>
                <div className="chart-subtitle">Breakdown per post</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <EngagementChart posts={filteredPosts} loading={loading} />
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Content Distribution</div>
                <div className="chart-subtitle">Format performance</div>
              </div>
            </div>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ContentTypePieChart posts={filteredPosts} loading={loading} />
            </div>
          </motion.div>
        </div>

        <motion.div variants={item} className="full-width-card glass-panel chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Engagement Rate per Post</div>
              <div className="chart-subtitle">Compared against your average</div>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <EngagementRateChart posts={filteredPosts} profile={profile} loading={loading} />
          </div>
        </motion.div>

        {/* Best Time Predictor */}
        <div style={{ marginBottom: 32 }}>
          <BestTimePredictor />
        </div>

        {/* Heatmap */}
        <motion.div variants={item} className="full-width-card glass-panel chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Interaction Heatmap</div>
              <div className="chart-subtitle">When your audience engages most</div>
            </div>
          </div>

          {filteredPosts.length < 3 ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">🕐</div>
              <div className="empty-state-title">Insufficient Data</div>
              <div className="empty-state-text">Sync more content to generate heatmap.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <div style={{ minWidth: 800 }}>
                <div style={{ display: 'flex', marginLeft: 60, marginBottom: 12 }}>
                  {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                    <div key={h} style={{ flex: 3, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                    </div>
                  ))}
                </div>

                {DAYS.map(day => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ width: 60, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 800, flexShrink: 0 }}>{day}</div>
                    <div style={{ display: 'flex', flex: 1, gap: 8 }}>
                      {HOURS.map(h => {
                        const val = heatmap[day][h].likes + heatmap[day][h].comments;
                        const intensity = maxHeatVal > 0 ? val / maxHeatVal : 0;
                        return (
                          <div
                            key={h}
                            title={`${day} ${h}:00 — ${heatmap[day][h].posts} posts, ${val} engagements`}
                            style={{
                              flex: 1,
                              height: 36,
                              borderRadius: 8,
                              background: intensity > 0
                                ? `rgba(92, 107, 250, ${0.1 + intensity * 0.9})`
                                : 'var(--bg-base)',
                              boxShadow: intensity > 0 ? 'none' : 'var(--neu-inner-sm)',
                              transition: 'all 0.2s',
                              cursor: intensity > 0 ? 'pointer' : 'default',
                            }}
                            onMouseEnter={e => { if(intensity>0) { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.zIndex = 10; e.currentTarget.style.boxShadow = 'var(--neu-drop-sm)'; } }}
                            onMouseLeave={e => { if(intensity>0) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 1; e.currentTarget.style.boxShadow = 'none'; } }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
