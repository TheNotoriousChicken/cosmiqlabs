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
          {/* Neo-Brutalism header bar */}
          <div style={{
            background: '#000', color: '#fff',
            padding: '12px 24px',
            margin: '-40px -40px 32px -40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              ◼ Interaction Heatmap
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', fontFamily: 'var(--font-mono)' }}>
              {onlineData?.length > 0 ? 'SOURCE: ONLINE FOLLOWERS API' : 'SOURCE: POST ENGAGEMENT DATA'}
            </div>
          </div>

          {!hasHeatmapData ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">🕐</div>
              <div className="empty-state-title">Insufficient Data</div>
              <div className="empty-state-text">Sync more content to generate heatmap.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: 720 }}>

                {/* Hour axis labels */}
                <div style={{ display: 'flex', marginLeft: 56, marginBottom: 6 }}>
                  {HOURS.map(h => (
                    <div key={h} style={{
                      flex: 1,
                      fontSize: 10,
                      fontWeight: 900,
                      color: '#000',
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      visibility: h % 3 === 0 ? 'visible' : 'hidden',
                    }}>
                      {h === 0 ? '12A' : h < 12 ? `${h}A` : h === 12 ? '12P' : `${h-12}P`}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {DAYS.map((day, dayIdx) => {
                  // Each day gets one palette color for its hot cells
                  const PALETTE = [
                    '#FFDF00', // Yellow
                    '#FF90E8', // Pink
                    '#8CFF98', // Green
                    '#00E5FF', // Cyan
                    '#FF914D', // Orange
                    '#D4B2FF', // Lavender
                    '#FF4444', // Red
                  ];
                  const dayColor = PALETTE[dayIdx % PALETTE.length];

                  return (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}>
                      {/* Day label */}
                      <div style={{
                        width: 48, flexShrink: 0,
                        fontSize: 12, fontWeight: 900,
                        fontFamily: 'var(--font-mono)',
                        color: '#000',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}>
                        {day}
                      </div>

                      {/* Hour cells */}
                      <div style={{ display: 'flex', flex: 1, gap: 2 }}>
                        {HOURS.map(h => {
                          const val = heatmap[day][h];
                          let intensity = 0;
                          if (val > 0 && maxHeatVal > 0) {
                            intensity = maxHeatVal > minHeatVal
                              ? (val - minHeatVal) / (maxHeatVal - minHeatVal)
                              : 0.5;
                          }

                          // Neo-Brutalism: 3 discrete tiers, not a gradient
                          // Empty → low (30% opacity) → mid (70%) → hot (100% + shadow)
                          let bg = '#F4F4F0';
                          let border = '2px solid #ccc';
                          let shadow = 'none';
                          let cellH = 34;

                          if (intensity > 0.66) {
                            bg = dayColor;
                            border = '2px solid #000';
                            shadow = '3px 3px 0px #000';
                            cellH = 38;
                          } else if (intensity > 0.33) {
                            bg = dayColor;
                            border = '2px solid #000';
                            shadow = '2px 2px 0px #000';
                            cellH = 34;
                            // Mid = 60% opacity via hex
                          } else if (intensity > 0) {
                            bg = dayColor + '55'; // low opacity via hex
                            border = '2px solid #000';
                            shadow = 'none';
                            cellH = 34;
                          }

                          const label = `${day} ${h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`}  ·  ${val.toLocaleString()} ${onlineData?.length > 0 ? 'online' : 'engagements'}`;

                          return (
                            <div key={h} style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div
                                style={{
                                  width: '100%',
                                  height: cellH,
                                  borderRadius: 0,
                                  background: bg,
                                  border,
                                  boxShadow: shadow,
                                  transition: 'transform 0.1s, box-shadow 0.1s',
                                  cursor: intensity > 0 ? 'crosshair' : 'default',
                                }}
                                onMouseEnter={e => {
                                  if (intensity > 0) {
                                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                                    e.currentTarget.style.boxShadow = '5px 5px 0px #000';
                                    e.currentTarget.nextSibling.style.display = 'block';
                                  }
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.transform = 'translate(0,0)';
                                  e.currentTarget.style.boxShadow = shadow;
                                  e.currentTarget.nextSibling.style.display = 'none';
                                }}
                              />
                              {/* Tooltip */}
                              <div style={{
                                display: 'none',
                                position: 'absolute',
                                bottom: 'calc(100% + 6px)',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#000',
                                color: dayColor === '#000000' ? '#fff' : dayColor,
                                fontSize: 11,
                                fontWeight: 900,
                                padding: '6px 10px',
                                border: '2px solid #000',
                                boxShadow: '3px 3px 0px ' + dayColor,
                                whiteSpace: 'nowrap',
                                zIndex: 200,
                                pointerEvents: 'none',
                                fontFamily: 'var(--font-mono)',
                              }}>
                                {label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Legend */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginTop: 24, marginLeft: 56,
                  padding: '10px 16px',
                  border: '2px solid #000',
                  boxShadow: '3px 3px 0px #000',
                  background: '#F4F4F0',
                  width: 'fit-content',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Intensity:</span>
                  {[
                    { label: 'NONE', bg: '#F4F4F0', border: '2px solid #ccc', shadow: 'none' },
                    { label: 'LOW', bg: '#FFDF0055', border: '2px solid #000', shadow: 'none' },
                    { label: 'MID', bg: '#FFDF00', border: '2px solid #000', shadow: '2px 2px 0 #000' },
                    { label: 'HOT', bg: '#FF914D', border: '2px solid #000', shadow: '3px 3px 0 #000' },
                  ].map(({ label, bg, border, shadow }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 20, background: bg, border, boxShadow: shadow, borderRadius: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>{label}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
