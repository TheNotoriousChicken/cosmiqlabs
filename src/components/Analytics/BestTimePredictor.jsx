import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { useInstagramData } from '../../hooks/useInstagramData';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BestTimePredictor() {
  const { posts } = useInstagramData();

  const bestTime = useMemo(() => {
    if (!posts || posts.length < 5) return null; // Need enough data

    const buckets = {}; // "Day_Hour" -> { totalReach: 0, count: 0 }

    posts.forEach(post => {
      if (!post.timestamp) return;
      const date = new Date(post.timestamp);
      const day = date.getDay();
      const hour = date.getHours();
      const key = `${day}_${hour}`;
      
      const reach = post.insights?.reach || post.insights?.views || 0;
      
      if (!buckets[key]) buckets[key] = { reach: 0, count: 0 };
      buckets[key].reach += reach;
      buckets[key].count += 1;
    });

    let maxAvg = 0;
    let bestKey = null;

    Object.entries(buckets).forEach(([key, data]) => {
      if (data.count === 0) return;
      const avg = data.reach / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        bestKey = key;
      }
    });

    if (!bestKey || maxAvg === 0) return null;

    const [day, hour] = bestKey.split('_').map(Number);
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';

    // Calculate baseline to show uplift
    const totalReach = Object.values(buckets).reduce((sum, b) => sum + b.reach, 0);
    const totalPosts = Object.values(buckets).reduce((sum, b) => sum + b.count, 0);
    const baselineAvg = totalPosts > 0 ? totalReach / totalPosts : 0;
    const uplift = baselineAvg > 0 ? ((maxAvg - baselineAvg) / baselineAvg) * 100 : 0;

    return {
      day: DAYS[day],
      time: `${hour12}:00 ${ampm}`,
      uplift: Math.round(uplift),
      avgReach: Math.round(maxAvg)
    };
  }, [posts]);

  if (!bestTime) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel" 
      style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 24, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{
        position: 'absolute', top: -50, right: -50, width: 150, height: 150, 
        background: 'var(--accent-color)', filter: 'blur(80px)', opacity: 0.15, borderRadius: '50%'
      }} />

      <div style={{ 
        width: 64, height: 64, borderRadius: 'var(--r-full)', 
        background: 'var(--bg-base)', boxShadow: 'var(--neu-drop-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)'
      }}>
        <Clock size={32} />
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Predicted Optimal Time
        </h3>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {bestTime.day}s at {bestTime.time}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--success)', fontWeight: 600 }}>
          <TrendingUp size={16} />
          +{bestTime.uplift}% expected reach vs. your average
        </div>
      </div>
    </motion.div>
  );
}
