import { RefreshCw, Clock } from 'lucide-react';
import { useInstagramData } from '../../hooks/useInstagramData';
import { useAppStore } from '../../store/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

export default function TopBar({ title, subtitle }) {
  const { loading, lastFetch, activeRange, mode, refresh } = useInstagramData();
  const setActiveRange = useAppStore(s => s.setActiveRange);

  const RANGES = [
    { label: '7D',  value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
  ];

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="topbar"
    >
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
      </div>

      <div className="topbar-right">
        {lastFetch && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <Clock size={12} />
            {formatDistanceToNow(new Date(lastFetch), { addSuffix: true })}
          </div>
        )}

        <div className={`badge ${mode === 'live' ? 'badge-live' : 'badge-manual'}`}>
          {mode === 'live'
            ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }} /> LIVE</>
            : 'MANUAL'
          }
        </div>

        <div className="range-tabs">
          {RANGES.map(r => (
            <button
              key={r.value}
              className={`range-tab${activeRange === r.value ? ' active' : ''}`}
              onClick={() => setActiveRange(r.value)}
            >
              {activeRange === r.value && (
                <motion.div layoutId="topbarRange" className="range-tab-bg" />
              )}
              {r.label}
            </button>
          ))}
        </div>

        <button
          className="btn btn-secondary btn-icon"
          onClick={refresh}
          disabled={loading}
          style={{ borderRadius: '50%', padding: 12 }}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </motion.div>
  );
}
