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
        <div className="metrics-grid alt-colors-2">
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
            <div style={{ overflowX: 'auto', marginTop: 24 }}>
              <div style={{ minWidth: 680 }}>

                {/* Hour labels — every 3 hours, aligned to cells */}
                <div style={{ display: 'flex', marginLeft: 52, marginBottom: 8 }}>
                  {HOURS.map(h => (
                    <div key={h} style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      visibility: h % 3 === 0 ? 'visible' : 'hidden',
                    }}>
                      {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {DAYS.map((day) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ width: 44, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 800, flexShrink: 0 }}>
                      {day}
                    </div>
                    <div style={{ display: 'flex', flex: 1, gap: 3 }}>
                      {HOURS.map(h => {
                        const val = heatmap[day][h];
                        let intensity = 0;
                        if (val > 0 && maxHeatVal > 0) {
                          intensity = maxHeatVal > minHeatVal
                            ? (val - minHeatVal) / (maxHeatVal - minHeatVal)
                            : 0.5;
                        }

                        // Color: cold = green, warm = yellow, hot = red/pink
                        const getColor = (t) => {
                          if (t <= 0) return null;
                          if (t < 0.33) return `rgba(92, 219, 149, ${0.3 + t * 2})`;
                          if (t < 0.66) return `rgba(255, 200, 40, ${0.4 + t})`;
                          return `rgba(255, 60, 100, ${0.5 + t * 0.5})`;
                        };

                        const bg = getColor(intensity);
                        const label = `${day} ${h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`} — ${val.toLocaleString()} ${onlineData?.length > 0 ? 'online' : 'engagements'}`;

                        return (
                          <div key={h} style={{ position: 'relative', flex: 1 }}>
                            <div
                              style={{
                                height: 32,
                                borderRadius: 4,
                                background: bg || 'var(--bg-elevated)',
                                border: intensity > 0 ? '1.5px solid rgba(0,0,0,0.25)' : '1px solid var(--border-default)',
                                boxShadow: intensity > 0.66 ? '0 2px 8px rgba(255,60,100,0.4)' : intensity > 0.33 ? '0 2px 6px rgba(255,200,40,0.3)' : 'none',
                                transition: 'transform 0.15s',
                                cursor: intensity > 0 ? 'pointer' : 'default',
                              }}
                              onMouseEnter={e => {
                                if (intensity > 0) {
                                  e.currentTarget.style.transform = 'scaleY(1.3)';
                                  e.currentTarget.nextSibling.style.display = 'block';
                                }
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'scaleY(1)';
                                e.currentTarget.nextSibling.style.display = 'none';
                              }}
                            />
                            <div style={{
                              display: 'none',
                              position: 'absolute',
                              bottom: 'calc(100% + 8px)',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'var(--text-primary)',
                              color: 'var(--bg-base)',
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '5px 8px',
                              borderRadius: 6,
                              whiteSpace: 'nowrap',
                              zIndex: 100,
                              pointerEvents: 'none',
                              border: '1.5px solid rgba(0,0,0,0.3)',
                            }}>
                              {label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, marginLeft: 52 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>LOW</span>
                  {[0.05, 0.2, 0.4, 0.6, 0.8, 1.0].map((t, i) => (
                    <div key={i} style={{
                      width: 24, height: 14, borderRadius: 3,
                      background: t < 0.33
                        ? `rgba(92, 219, 149, ${0.3 + t * 2})`
                        : t < 0.66
                          ? `rgba(255, 200, 40, ${0.4 + t})`
                          : `rgba(255, 60, 100, ${0.5 + t * 0.5})`,
                      border: '1px solid rgba(0,0,0,0.2)',
                    }} />
                  ))}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>HIGH</span>
                </div>

              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
