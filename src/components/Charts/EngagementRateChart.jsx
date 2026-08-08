import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#8B5CF6', fontWeight: 700 }}>ER: {payload[0]?.value?.toFixed(2)}%</div>
    </div>
  );
};

export default function EngagementRateChart({ posts, profile, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />;
  if (!posts?.length || !profile?.followers_count) return null;

  const data = posts
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-15)
    .map((p, i) => ({
      name: `P${i + 1}`,
      er: profile.followers_count
        ? (((p.like_count || 0) + (p.comments_count || 0)) / profile.followers_count) * 100
        : 0,
    }));

  const avg = data.reduce((s, d) => s + d.er, 0) / data.length;

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: 8 }}>
        Avg ER: <span style={{ color: 'var(--brand-purple)', fontWeight: 700 }}>{avg.toFixed(2)}%</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}%`} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="er" radius={[4, 4, 0, 0]} name="Engagement Rate">
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.er >= avg ? '#8B5CF6' : 'rgba(139,92,246,0.4)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
