import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#10B981', '#3B82F6'];
const LABELS = { IMAGE: 'Photos', VIDEO: 'Videos', CAROUSEL_ALBUM: 'Carousels', REEL: 'Reels' };

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
      borderRadius: '10px', padding: '10px 14px', fontSize: '13px',
    }}>
      <div style={{ color: payload[0].payload.fill, fontWeight: 700 }}>{payload[0].name}</div>
      <div style={{ color: 'var(--text-secondary)' }}>{payload[0].value} posts ({((payload[0].payload.percent || 0) * 100).toFixed(0)}%)</div>
    </div>
  );
};

export default function ContentTypePieChart({ posts, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 200, borderRadius: '50%', width: 200, margin: '0 auto' }} />;

  if (!posts || posts.length === 0) return null;

  const counts = posts.reduce((acc, p) => {
    const type = p.media_type || 'IMAGE';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([type, count]) => ({
    name: LABELS[type] || type,
    value: count,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
