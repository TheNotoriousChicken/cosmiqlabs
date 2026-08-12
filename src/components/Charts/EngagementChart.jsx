import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ 
      background: 'var(--bg-base)', 
      border: 'var(--brutal-border)', 
      borderRadius: 'var(--r-md)', 
      padding: '12px 16px', 
      fontSize: 12, 
      fontFamily: 'var(--font-mono)',
      boxShadow: 'var(--brutal-shadow)',
      color: 'var(--text-primary)'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 10, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700, marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <span>{p.name}</span>
          <span style={{ color: 'var(--text-primary)' }}>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const LINES = [
  { key: 'likes',    color: 'var(--palette-2)', label: 'Likes'    },
  { key: 'comments', color: 'var(--palette-1)', label: 'Comments' },
  { key: 'saves',    color: 'var(--palette-3)', label: 'Saves'    },
  { key: 'shares',   color: 'var(--palette-4)', label: 'Shares'   },
];

export default function EngagementChart({ posts, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />;
  
  if (!posts?.length) return (
    <div className="empty-state" style={{ padding: '60px 40px' }}>
      <div className="empty-state-icon" style={{ fontSize: 48 }}>◎</div>
      <div className="empty-state-title" style={{ fontSize: 18 }}>No Content</div>
      <div className="empty-state-text" style={{ fontSize: 14 }}>Sync to load your recent posts.</div>
    </div>
  );

  const data = posts
    .slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-20)
    .map(p => ({
      date:     new Date(p.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      likes:    p.like_count || 0,
      comments: p.comments_count || 0,
      saves:    p.insights?.saved || 0,
      shares:   p.insights?.shares || 0,
    }));

  return (
    <>
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        {LINES.map(l => (
          <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block', boxShadow: `0 0 8px ${l.color}` }} />
            {l.label}
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <Tooltip content={<TT />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          {LINES.map(l => (
            <Line 
              key={l.key} 
              type="monotone" 
              dataKey={l.key} 
              stroke={l.color} 
              strokeWidth={2}
              dot={false} 
              name={l.label} 
              activeDot={{ r: 5, strokeWidth: 0, fill: '#fff' }} 
              animationDuration={1500}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
