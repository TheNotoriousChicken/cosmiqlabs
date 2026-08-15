import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LivePostTimer({ latestPost }) {
  const [timeStr, setTimeStr] = useState('00:00:00:00');

  useEffect(() => {
    if (!latestPost?.timestamp) return;

    const postDate = new Date(latestPost.timestamp);

    const updateTimer = () => {
      const now = new Date();
      const diffMs = now - postDate;

      if (diffMs < 0) {
        setTimeStr('00:00:00:00');
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / 1000 / 60) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      const pad = (n) => n.toString().padStart(2, '0');
      setTimeStr(`${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [latestPost]);

  if (!latestPost) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-panel" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '12px', 
        padding: '24px', 
        marginBottom: '24px',
        background: 'var(--accent-color)',
        color: 'var(--accent-secondary)'
      }}
    >
      <Clock size={28} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Time Since Last Upload</span>
        <span style={{ fontSize: '32px', fontWeight: '900', fontFamily: 'monospace' }}>{timeStr}</span>
      </div>
    </motion.div>
  );
}
