import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useInstagramData } from '../hooks/useInstagramData';
import { Save, Download, Trash2, PlusCircle, Eye, EyeOff, Key, Database, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Settings() {
  const { accessToken, mode, snapshots, setAccessToken, setMode, addSnapshot, clearSnapshots } = useAppStore();
  const { profile } = useInstagramData();

  const [tokenInput, setTokenInput] = useState(accessToken || import.meta.env.VITE_IG_ACCESS_TOKEN || '');
  const [showToken, setShowToken] = useState(false);
  const [manualFollowers, setManualFollowers] = useState('');
  const [manualDate, setManualDate] = useState('');

  const saveToken = () => {
    setAccessToken(tokenInput.trim());
    toast.success('Access token saved!', {
      style: { background: 'var(--bg-base)', color: 'var(--text-primary)', border: 'none', boxShadow: 'var(--neu-drop)' }
    });
  };

  const addManualSnapshot = () => {
    const count = parseInt(manualFollowers, 10);
    if (!count || count < 0) return toast.error('Enter a valid follower count');
    addSnapshot({
      followers_count: count,
      source: 'manual',
      timestamp: manualDate ? new Date(manualDate).toISOString() : new Date().toISOString(),
    });
    setManualFollowers('');
    setManualDate('');
    toast.success('Snapshot added!');
  };

  const exportJSON = () => {
    const data = { profile, snapshots, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instatrack-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  };

  const exportCSV = () => {
    const rows = [
      ['Date', 'Followers', 'Change', 'Source'],
      ...snapshots
        .slice()
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((s, i, arr) => [
          new Date(s.timestamp).toLocaleString(),
          s.followers_count,
          i > 0 ? s.followers_count - arr[i - 1].followers_count : 0,
          s.source || 'auto',
        ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instatrack-snapshots-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported!');
  };

  const handleClear = () => {
    if (window.confirm('Delete all snapshot history? This cannot be undone.')) {
      clearSnapshots();
      toast.success('History cleared.');
    }
  };

  return (
    <div>
      <motion.div 
        className="page-container" 
        style={{ maxWidth: 1000 }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="charts-grid">
          
          {/* Access Token */}
          <motion.div variants={item} className="full-width-card brutal-panel chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--bg-base)', padding: 16, borderRadius: '50%', color: 'var(--accent-color)', boxShadow: 'var(--neu-inner-sm)' }}>
                  <Key size={24} />
                </div>
                <div>
                  <div className="chart-title">Access Token</div>
                  <div className="chart-subtitle">Instagram Graph API authorization</div>
                </div>
              </div>
            </div>

            <div className="input-group">
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  className="input-field"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="Long-lived access token..."
                  style={{ paddingRight: 60 }}
                />
                <button
                  className="btn btn-icon"
                  onClick={() => setShowToken(!showToken)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, background: 'transparent', boxShadow: 'none' }}
                >
                  {showToken ? <EyeOff size={18} color="var(--text-secondary)" /> : <Eye size={18} color="var(--text-secondary)" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between" style={{ marginTop: 24 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Token stored securely in local browser storage.
              </div>
              <div className="flex gap-4 items-center">
                {accessToken && <span className="badge badge-live">Configured</span>}
                <button className="btn btn-primary" onClick={saveToken}>Save Token</button>
              </div>
            </div>
          </motion.div>

          {/* Mode toggle */}
          <motion.div variants={item} className="full-width-card brutal-panel chart-card" style={{ gridColumn: 'span 2' }}>
            <div className="chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'var(--bg-base)', padding: 16, borderRadius: '50%', color: 'var(--warning)', boxShadow: 'var(--neu-inner-sm)' }}>
                  <Zap size={24} />
                </div>
                <div>
                  <div className="chart-title">Operation Mode</div>
                  <div className="chart-subtitle">Switch data fetching behavior</div>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {['live', 'manual'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); toast.success(`${m.toUpperCase()} mode activated`); }}
                  style={{
                    padding: 32, borderRadius: 'var(--r-lg)',
                    background: 'var(--bg-base)',
                    color: mode === m ? 'var(--accent-color)' : 'var(--text-secondary)',
                    boxShadow: mode === m ? 'var(--neu-inner-sm)' : 'var(--neu-drop-sm)',
                    border: 'none',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    position: 'relative', overflow: 'hidden'
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 12, letterSpacing: '-0.5px' }}>
                    {m === 'live' ? 'LIVE API' : 'MANUAL'}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 600 }}>
                    {m === 'live'
                      ? 'Fetches real data from Graph API'
                      : 'Allows manual data entry'}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Manual Entry */}
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <PlusCircle size={24} color="var(--text-secondary)" />
                <div className="chart-title">Manual Log</div>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Follower Count</label>
              <input type="number" className="input-field" placeholder="0" value={manualFollowers} onChange={e => setManualFollowers(e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={manualDate} onChange={e => setManualDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
            </div>
            <button className="btn btn-secondary w-full" onClick={addManualSnapshot} style={{ marginTop: 16 }}>
              Add Snapshot
            </button>
          </motion.div>

          {/* Data Management */}
          <motion.div variants={item} className="brutal-panel chart-card">
            <div className="chart-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Database size={24} color="var(--text-secondary)" />
                <div className="chart-title">Data Storage</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <button className="btn btn-secondary w-full" onClick={exportJSON}>
                <Download size={16} /> Export JSON
              </button>
              <button className="btn btn-secondary w-full" onClick={exportCSV}>
                <Download size={16} /> Export CSV
              </button>
              <div style={{ height: 1, background: 'var(--shadow-light)', margin: '16px 0', boxShadow: '0 1px 0 var(--shadow-dark)' }} />
              <button className="btn btn-secondary w-full" onClick={handleClear} style={{ color: 'var(--danger)' }}>
                <Trash2 size={16} /> Wipe Database
              </button>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
}
