import {
  AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ 
      background: 'rgba(10, 10, 10, 0.85)', 
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-strong)', 
      borderRadius: 12, 
      padding: '12px 16px', 
      fontSize: 13, 
      fontFamily: 'var(--font-mono)',
      boxShadow: 'var(--shadow-glass)'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 16 }}>
          {p.value?.toLocaleString()} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>followers</span>
          {p.payload?.delta !== 0 && p.payload?.delta !== undefined && (
            <span style={{ color: p.payload.delta > 0 ? 'var(--success)' : 'var(--danger)', marginLeft: 12, fontSize: 12 }}>
              {p.payload.delta > 0 ? '+' : ''}{p.payload.delta}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default function FollowerGrowthChart({ data, loading }) {
  if (loading) return <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />;

  if (!data || data.length < 2) {
    return (
      <div className="empty-state" style={{ padding: '60px 40px' }}>
        <div className="empty-state-icon" style={{ fontSize: 48 }}>◈</div>
        <div className="empty-state-title" style={{ fontSize: 18 }}>Insufficient Data</div>
        <div className="empty-state-text" style={{ fontSize: 14 }}>Tracking will visualize here after your next sync.</div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.followers));
  const minVal = Math.min(...data.map(d => d.followers));
  const buffer = (maxVal - minVal) * 0.1;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--accent-blue)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--accent-violet)" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <Tooltip content={<TT />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        
        <ReferenceLine y={maxVal} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
        <ReferenceLine y={minVal} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
        
        <Area 
          type="monotone" 
          dataKey="followers" 
          stroke="url(#glowGrad)" 
          strokeWidth={3} 
          fill="url(#glowGrad)"
          name="Followers" 
          dot={false} 
          activeDot={{ r: 6, fill: '#fff', stroke: 'var(--accent-blue)', strokeWidth: 3 }} 
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
