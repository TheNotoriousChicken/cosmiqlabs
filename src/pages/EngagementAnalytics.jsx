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
import { Sparkles, Loader2, Clock, Activity } from 'lucide-react';
import { analyzeBestPostTime, analyzeEngagementDrop } from '../services/geminiApi';

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
  const [bestTime, setBestTime] = useState(null);
  const [loadingBestTime, setLoadingBestTime] = useState(false);
  const [engDiagnosis, setEngDiagnosis] = useState(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);

  const handleBestTime = async () => {
    if (!onlineData?.length) return;
    setLoadingBestTime(true);
    try {
      const result = await analyzeBestPostTime(onlineData);
      setBestTime(result);
    } catch (e) {
      setBestTime({ primary_window: 'Analysis failed', why: e.message, confidence: 'low', secondary_window: null, data_note: null });
    } finally {
      setLoadingBestTime(false);
    }
  };

  const handleEngagementDiagnosis = async () => {
    setLoadingDiagnosis(true);
    try {
      const result = await analyzeEngagementDrop(onlineData || [], filteredPosts, profile?.followers_count);
      setEngDiagnosis(result);
    } catch (e) {
      setEngDiagnosis(null);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

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
              <div className="chart-subtitle">
                When your audience engages most ({onlineData?.length > 0 ? 'Online Followers' : 'Post Engagement'})
              </div>
            </div>
          </div>

          {!hasHeatmapData ? (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-state-icon">🕐</div>
              <div className="empty-state-title">Insufficient Data</div>
              <div className="empty-state-text">Sync more content to generate heatmap.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', paddingTop: 40, marginTop: -40, paddingBottom: 20, marginBottom: -20 }}>
              <div style={{ minWidth: 720 }}>

                {/* Hour axis labels */}
                <div style={{ display: 'flex', marginLeft: 56, marginBottom: 6 }}>
                  {HOURS.map(h => (
                    <div key={h} style={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      visibility: h % 3 === 0 ? 'visible' : 'hidden',
                    }}>
                      {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                {DAYS.map((day, dayIdx) => {
                  // Each day gets one palette color for its hot cells (matching BestTimePredictor)
                  const PALETTE = [
                    '#FFDF00', // Yellow
                    '#FF90E8', // Pink
                    '#8CFF98', // Green
                    '#00E5FF', // Cyan
                    '#FF914D', // Orange
                    '#D4B2FF', // Lavender
                  ];
                  const dayColor = PALETTE[dayIdx % PALETTE.length];

                  return (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                      {/* Day label */}
                      <div style={{
                        width: 48, flexShrink: 0,
                        fontSize: 13, fontWeight: 700,
                        color: 'var(--text-secondary)',
                      }}>
                        {day}
                      </div>

                      {/* Hour cells */}
                      <div style={{ display: 'flex', flex: 1, gap: 6 }}>
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
                                  borderRadius: 4,
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
                                left: h < 3 ? 0 : h > 20 ? 'auto' : '50%',
                                right: h > 20 ? 0 : 'auto',
                                transform: h < 3 || h > 20 ? 'none' : 'translateX(-50%)',
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
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Intensity:</span>
                  {[
                    { label: 'None', bg: '#F4F4F0', border: '2px solid #ccc', shadow: 'none' },
                    { label: 'Low', bg: '#FFDF0055', border: '2px solid #000', shadow: 'none' },
                    { label: 'Mid', bg: '#FFDF00', border: '2px solid #000', shadow: '2px 2px 0 #000' },
                    { label: 'Hot', bg: '#FF914D', border: '2px solid #000', shadow: '3px 3px 0 #000' },
                  ].map(({ label, bg, border, shadow }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 20, height: 20, background: bg, border, boxShadow: shadow, borderRadius: 4 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}
        </motion.div>

        {/* AI Best Time to Post */}
        <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bestTime ? 24 : 0 }}>
            <div>
              <div className="chart-title">AI Best Time to Post</div>
              <div className="chart-subtitle">Analyzes your real follower activity heatmap — not generic benchmarks</div>
            </div>
            <button
              onClick={handleBestTime}
              disabled={loadingBestTime || !onlineData?.length}
              style={{
                padding: '10px 20px',
                background: loadingBestTime || !onlineData?.length ? '#ccc' : 'var(--palette-2)',
                border: '2px solid #000', boxShadow: loadingBestTime || !onlineData?.length ? 'none' : '3px 3px 0 #000',
                fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
                cursor: loadingBestTime || !onlineData?.length ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
              }}
            >
              {loadingBestTime ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : <><Clock size={14} /> Find Best Time</>}
            </button>
          </div>
          {!onlineData?.length && !bestTime && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, padding: '8px 0' }}>Online follower heatmap data required. Hit Sync to load it.</div>
          )}
          {onlineData?.length > 0 && !bestTime && !loadingBestTime && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, padding: '8px 0' }}>Click Find Best Time to analyze your audience's peak activity windows.</div>
          )}
          {bestTime && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 20, background: 'var(--palette-2)', border: '3px solid #000', boxShadow: '4px 4px 0 #000', gridColumn: 'span 2' }}>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Primary Window</div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>{bestTime.primary_window}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginTop: 8, opacity: 0.8 }}>{bestTime.why}</div>
              </div>
              {bestTime.secondary_window && (
                <div style={{ padding: 16, border: '2px solid #000', boxShadow: '3px 3px 0 #000', background: '#fafafa' }}>
                  <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Secondary Window</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{bestTime.secondary_window}</div>
                </div>
              )}
              <div style={{ padding: 16, border: '2px solid #000', boxShadow: '3px 3px 0 #000', background: '#fafafa' }}>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Confidence</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: bestTime.confidence === 'high' ? 'var(--success)' : bestTime.confidence === 'low' ? 'var(--danger)' : 'var(--text-primary)' }}>
                  {bestTime.confidence?.toUpperCase()}
                </div>
              </div>
              {bestTime.data_note && (
                <div style={{ gridColumn: 'span 2', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 600 }}>⚠ {bestTime.data_note}</div>
              )}
            </div>
          )}
        </motion.div>

        {/* AI Engagement Health Diagnosis */}
        <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: engDiagnosis ? 24 : 0 }}>
            <div>
              <div className="chart-title">AI Engagement Health Diagnosis</div>
              <div className="chart-subtitle">Detects drops, diagnoses causes, gives one prioritized action</div>
            </div>
            <button
              onClick={handleEngagementDiagnosis}
              disabled={loadingDiagnosis}
              style={{
                padding: '10px 20px', background: loadingDiagnosis ? '#ccc' : 'var(--palette-3)',
                border: '2px solid #000', boxShadow: loadingDiagnosis ? 'none' : '3px 3px 0 #000',
                fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
                cursor: loadingDiagnosis ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
              }}
            >
              {loadingDiagnosis ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Diagnosing...</> : <><Activity size={14} /> Run Diagnosis</>}
            </button>
          </div>
          {!engDiagnosis && !loadingDiagnosis && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, padding: '8px 0' }}>
              Click Run Diagnosis to assess your current engagement health and get one prioritized action.
            </div>
          )}
          {engDiagnosis && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 18px', border: '2px solid #000', fontWeight: 900, fontSize: 13, background: engDiagnosis.status === 'healthy' || engDiagnosis.status === 'recovering' ? 'var(--palette-3)' : engDiagnosis.status === 'declining' ? '#ffe5e5' : 'var(--palette-1)' }}>
                  Status: {engDiagnosis.status?.toUpperCase()}
                </div>
                <div style={{ padding: '10px 18px', border: '2px solid #000', fontWeight: 700, fontSize: 13, background: '#fafafa' }}>
                  Avg ER: {engDiagnosis.engagement_rate}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>{engDiagnosis.trend_summary}</div>
              {engDiagnosis.likely_cause && (
                <div style={{ padding: 16, border: '2px solid #000', boxShadow: '3px 3px 0 #000', background: '#fffbe6' }}>
                  <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Likely Cause</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{engDiagnosis.likely_cause}</div>
                </div>
              )}
              <div style={{ padding: 20, background: 'var(--palette-2)', border: '3px solid #000', boxShadow: '4px 4px 0 #000' }}>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>One Action Now</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{engDiagnosis.action}</div>
              </div>
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
