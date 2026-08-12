import EngagementChart from '../components/Charts/EngagementChart';
import EngagementRateChart from '../components/Charts/EngagementRateChart';
import ContentTypePieChart from '../components/Charts/ContentTypePieChart';
import BestTimePredictor from '../components/Analytics/BestTimePredictor';
import { useInstagramData } from '../hooks/useInstagramData';
import { useAppStore } from '../store/useAppStore';
import { fetchOnlineFollowers } from '../services/instagramApi';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { useState, useEffect } from 'react';

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
  const { accessToken } = useAppStore();
  const [onlineData, setOnlineData] = useState(null);

  useEffect(() => {
    if (accessToken) {
      fetchOnlineFollowers(accessToken).then(setOnlineData);
    }
  }, [accessToken]);

  // Heatmap calculation
  const heatmap = {};
  DAYS.forEach(d => { heatmap[d] = {}; HOURS.forEach(h => { heatmap[d][h] = 0; }); });
  let hasHeatmapData = false;

  if (onlineData && onlineData.length > 0) {
    onlineData.forEach(dayRecord => {
      if (dayRecord.end_time && Object.keys(dayRecord.value || {}).length > 0) {
        hasHeatmapData = true;
        const dateObj = new Date(dayRecord.end_time);
        dateObj.setDate(dateObj.getDate() - 1); // data is for the day ending at this time
        const dayString = DAYS[dateObj.getDay()];
        
        Object.entries(dayRecord.value).forEach(([hourStr, count]) => {
          const h = parseInt(hourStr, 10);
          if (heatmap[dayString]) {
            heatmap[dayString][h] = Math.max(heatmap[dayString][h], count);
          }
        });
      }
    });
  } else {
    // Fallback to post-based heatmap if API fails
    filteredPosts.forEach(p => {
      const d = new Date(p.timestamp);
      const day = DAYS[d.getDay()];
      const hour = d.getHours();
      if (heatmap[day]?.[hour] !== undefined) {
        heatmap[day][hour] += (p.like_count || 0) + (p.comments_count || 0);
        if (heatmap[day][hour] > 0) hasHeatmapData = true;
      }
    });
  }

  const allValues = Object.values(heatmap).flatMap(d => Object.values(d));
  const maxHeatVal = Math.max(...allValues);
  // Find the minimum non-zero value to use as a baseline for scaling
  const minHeatVal = Math.min(...allValues.filter(v => v > 0));

  const metrics = [
    { label: 'Avg Eng. Rate', value: avgEngagementRate, suffix: '%' },
    { label: 'Total Reach', value: totals.reach },
    { label: 'Total Views', value: totals.views },
    { label: 'Total Saves', value: totals.saves },
  ];

  return (
    <div>
      <motion.div 
        className="page-container"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Quick Metrics */}
        <div className="metrics-grid">
          {metrics.map((m, i) => (
            <motion.div variants={item} key={m.label} className="brutal-panel metric-card">
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
          <motion.div variants={item} className="brutal-panel chart-card">
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

          <motion.div variants={item} className="brutal-panel chart-card">
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

        <motion.div variants={item} className="full-width-card brutal-panel chart-card">
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
        <motion.div variants={item} className="full-width-card brutal-panel chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Interaction Heatmap</div>
              <div className="chart-subtitle">When your audience engages most</div>
            </div>
          </div>

          {!hasHeatmapData ? (
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

                {DAYS.map((day, dayIndex) => {
                  const BRUTAL_COLORS = ['var(--palette-1)', 'var(--palette-2)', 'var(--palette-3)', 'var(--palette-4)', 'var(--palette-5)', 'var(--palette-6)'];
                  return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ width: 60, fontSize: 14, color: 'var(--text-secondary)', fontWeight: 800, flexShrink: 0 }}>{day}</div>
                    <div style={{ display: 'flex', flex: 1, gap: 8 }}>
                      {HOURS.map(h => {
                        const val = heatmap[day][h];
                        let intensity = 0;
                        if (val > 0) {
                          if (maxHeatVal > minHeatVal) {
                            intensity = 0.2 + ((val - minHeatVal) / (maxHeatVal - minHeatVal)) * 0.8;
                          } else {
                            intensity = 0.5;
                          }
                        }
                        return (
                          <div
                            key={h}
                            title={`${day} ${h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`} — ${val} ${hasHeatmapData && onlineData?.length > 0 ? 'online followers' : 'engagements'}`}
                            style={{
                              flex: 1,
                              height: 36,
                              borderRadius: 4,
                              background: intensity > 0
                                ? BRUTAL_COLORS[dayIndex % BRUTAL_COLORS.length]
                                : 'var(--bg-elevated)',
                              opacity: intensity > 0 ? (0.3 + intensity * 0.7) : 1,
                              border: intensity > 0 ? 'var(--brutal-border)' : '1px solid var(--border-default)',
                              boxShadow: intensity > 0 ? '2px 2px 0px #000' : 'none',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={e => { if(intensity>0) { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.zIndex = 10; e.currentTarget.style.boxShadow = '0 8px 24px rgba(92, 107, 250, 0.4)'; } }}
                            onMouseLeave={e => { if(intensity>0) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = 1; e.currentTarget.style.boxShadow = '0 4px 12px rgba(92, 107, 250, 0.2)'; } }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
