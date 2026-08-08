import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CountUp from 'react-countup';

const formatVal = (v) => {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string') return v;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
  if (!Number.isInteger(v)) return v.toFixed(2);
  return v.toLocaleString();
};

export default function MetricCard({ label, value, delta, suffix = '', prefix = '', loading }) {
  const isUp   = delta > 0;
  const isDown = delta < 0;

  return (
    <div className="glass-panel metric-card">
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
      </div>

      {loading ? (
        <div>
          <div className="skeleton" style={{ height: 42, width: '60%', marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 24, width: '40%' }} />
        </div>
      ) : (
        <div>
          <div className="metric-value">
            {prefix}
            {typeof value === 'number' ? (
              (() => {
                const SafeCountUp = CountUp.default || CountUp;
                return <SafeCountUp end={value} duration={2} separator="," decimals={!Number.isInteger(value) ? 2 : 0} />;
              })()
            ) : (
              value ?? '—'
            )}
            {suffix}
          </div>

          {delta !== undefined && delta !== null && (
            <div className={`metric-delta ${isUp ? 'delta-up' : isDown ? 'delta-down' : 'delta-flat'}`}>
              {isUp   ? <TrendingUp size={12} />   : null}
              {isDown ? <TrendingDown size={12} /> : null}
              {!isUp && !isDown ? <Minus size={12} /> : null}
              {isUp ? '+' : ''}{formatVal(delta)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
