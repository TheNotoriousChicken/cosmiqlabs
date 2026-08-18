import { useInstagramData } from '../hooks/useInstagramData';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import TopBar from '../components/Layout/TopBar';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { analyzeDemographics } from '../services/geminiApi';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const BRUTAL_COLORS = ['var(--palette-1)', 'var(--palette-2)', 'var(--palette-3)', 'var(--palette-4)', 'var(--palette-5)', 'var(--palette-6)'];

export default function Demographics() {
  const { demographics, filteredPosts, profile, loading } = useInstagramData();
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const handleAnalyze = async () => {
    setLoadingInsights(true);
    try {
      const result = await analyzeDemographics(demographics, filteredPosts, profile?.username ? `@${profile.username}` : '@cosmiq.labs');
      setInsights(result);
    } catch (e) {
      setInsights([]);
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Audience Demographics" subtitle="Who follows you?" />
        <div className="page-container">
          <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-lg)' }} />
        </div>
      </div>
    );
  }

  if (!demographics || Object.keys(demographics).length === 0) {
    return (
      <div>
        <TopBar title="Audience Demographics" subtitle="Who follows you?" />
        <div className="page-container">
          <div className="empty-state" style={{ padding: '60px' }}>
            <div className="empty-state-icon">🌍</div>
            <div className="empty-state-title">No Demographic Data</div>
            <div className="empty-state-text">
              Instagram requires a Business or Creator account with at least 100 followers to access this data. 
              Click Sync to check again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Process data for charts
  const ageData = Object.entries(demographics.age || {})
    .map(([range, value]) => ({ name: range, value }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const genderData = Object.entries(demographics.gender || {})
    .map(([g, value]) => ({ name: g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Unknown', value, original: g }))
    .sort((a, b) => b.value - a.value);

  const countryData = Object.entries(demographics.country || {})
    .map(([code, value]) => ({ name: code, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  const cityData = Object.entries(demographics.city || {})
    .map(([city, value]) => ({ name: city.split(',')[0], value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const totalCountries = countryData.reduce((sum, c) => sum + c.value, 0);
  const totalCities = cityData.reduce((sum, c) => sum + c.value, 0);

  const renderTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-base)', padding: '8px 12px', border: 'var(--brutal-border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--brutal-shadow)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {payload[0].name}: {payload[0].value.toLocaleString()}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <motion.div 
        className="page-container"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="charts-grid">
          {/* Age Distribution */}
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Age Distribution</div>
                <div className="chart-subtitle">Follower age groups</div>
              </div>
            </div>
            <div style={{ height: 300, marginTop: 20 }}>
              {ageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-default)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }} />
                    <RechartsTooltip content={renderTooltip} cursor={{ fill: 'rgba(150, 150, 150, 0.1)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      {ageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BRUTAL_COLORS[index % BRUTAL_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state">No data available</div>}
            </div>
          </motion.div>

          {/* Gender Split */}
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Gender Split</div>
                <div className="chart-subtitle">Follower gender ratio</div>
              </div>
            </div>
            <div style={{ height: 300, marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {genderData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%" cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BRUTAL_COLORS[index % BRUTAL_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={renderTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state">No data available</div>}
            </div>
            {/* Custom Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 16 }}>
              {genderData.map(entry => {
                const total = genderData.reduce((sum, g) => sum + g.value, 0);
                const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                return (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: BRUTAL_COLORS[genderData.indexOf(entry) % BRUTAL_COLORS.length] }} />
                    {entry.name} ({percent}%)
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Top Countries */}
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Top Countries</div>
                <div className="chart-subtitle">Where your audience lives</div>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              {countryData.length > 0 ? countryData.map((c, i) => {
                const percent = totalCountries > 0 ? ((c.value / totalCountries) * 100).toFixed(1) : 0;
                let countryName = c.name;
                try { countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(c.name) || c.name; } catch (e) {}
                
                return (
                  <div key={c.name} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {countryName}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: BRUTAL_COLORS[i % BRUTAL_COLORS.length] }}>{percent}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, background: BRUTAL_COLORS[i % BRUTAL_COLORS.length], height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              }) : <div className="empty-state">No data available</div>}
            </div>
          </motion.div>

          {/* Top Cities */}
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div>
                <div className="chart-title">Top Cities</div>
                <div className="chart-subtitle">Most concentrated urban areas</div>
              </div>
            </div>
            <div style={{ marginTop: 24 }}>
              {cityData.length > 0 ? cityData.map((c, i) => {
                const percent = totalCities > 0 ? ((c.value / totalCities) * 100).toFixed(1) : 0;
                return (
                  <div key={c.name} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: BRUTAL_COLORS[i % BRUTAL_COLORS.length] }}>{percent}%</div>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, background: BRUTAL_COLORS[i % BRUTAL_COLORS.length], height: '100%', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              }) : <div className="empty-state">No data available</div>}
            </div>
          </motion.div>
        </div>

        {/* AI Audience Insights */}
        <motion.div variants={item} className="full-width-card brutal-panel" style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: insights ? 24 : 0 }}>
            <div>
              <div className="chart-title">AI Audience Insights</div>
              <div className="chart-subtitle">3 data-grounded actions from your demographic breakdown</div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loadingInsights}
              style={{
                padding: '10px 20px', background: loadingInsights ? '#ccc' : 'var(--palette-2)',
                border: '2px solid #000', boxShadow: loadingInsights ? 'none' : '3px 3px 0 #000',
                fontWeight: 900, fontSize: 12, textTransform: 'uppercase',
                cursor: loadingInsights ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
              }}
            >
              {loadingInsights
                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                : <><Sparkles size={14} /> Analyze Audience</>}
            </button>
          </div>

          {insights === null && !loadingInsights && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, padding: '8px 0' }}>
              Click Analyze Audience to get 3 sharp, data-backed content strategy insights.
            </div>
          )}

          {insights !== null && !loadingInsights && (
            insights.length === 0 ? (
              <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 14 }}>Could not generate insights — demographics data may be insufficient.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ padding: 20, border: '2px solid #000', boxShadow: '3px 3px 0 #000', background: i === 0 ? 'var(--palette-1)' : i === 1 ? 'var(--palette-2)' : 'var(--palette-3)' }}>
                    <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8, lineHeight: 1.4 }}>{ins.insight}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 10 }}>📊 {ins.data_point}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, borderTop: '2px solid rgba(0,0,0,0.2)', paddingTop: 10 }}>→ {ins.action}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
