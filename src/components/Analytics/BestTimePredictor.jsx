import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star } from 'lucide-react';
import { useInstagramData } from '../../hooks/useInstagramData';
import { useAppStore } from '../../store/useAppStore';
import { fetchOnlineFollowers } from '../../services/instagramApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FALLBACK_TIMES = [9, 12, 17]; // 9 AM, 12 PM, 5 PM if no data exists

const formatHour = (hour) => {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12} ${ampm}`;
};

export default function BestTimePredictor() {
  const { posts } = useInstagramData();
  const { accessToken } = useAppStore();
  const [onlineData, setOnlineData] = useState(null);

  useEffect(() => {
    if (accessToken) {
      fetchOnlineFollowers(accessToken).then(setOnlineData);
    }
  }, [accessToken]);

  const schedule = useMemo(() => {
    const weeklySchedule = {};
    DAYS.forEach(d => weeklySchedule[d] = []);

    let hasOnlineData = false;

    // 1. Try to use Online Followers API (Most Accurate)
    if (onlineData && onlineData.length > 0) {
      onlineData.forEach(dayRecord => {
        if (dayRecord.end_time && Object.keys(dayRecord.value || {}).length > 0) {
          hasOnlineData = true;
          const dateObj = new Date(dayRecord.end_time);
          dateObj.setDate(dateObj.getDate() - 1);
          const dayString = DAYS[dateObj.getDay()];

          Object.entries(dayRecord.value).forEach(([hourStr, val]) => {
            const h = parseInt(hourStr, 10);
            const existing = weeklySchedule[dayString].find(x => x.hour === h);
            if (existing) {
              existing.val = Math.max(existing.val, val);
            } else {
              weeklySchedule[dayString].push({ hour: h, val });
            }
          });
        }
      });
    }

    // Process and sort top 3 times for each day
    DAYS.forEach(day => {
      if (weeklySchedule[day].length > 0) {
        // Sort by highest online/reach value and take top 3
        weeklySchedule[day].sort((a, b) => b.val - a.val);
        weeklySchedule[day] = weeklySchedule[day].slice(0, 3).map(x => x.hour);
        // Sort the resulting 3 hours chronologically for display
        weeklySchedule[day].sort((a, b) => a - b);
      }
    });

    // 2. Fallback to Historical Posts if Online Data is missing or sparse
    if (!hasOnlineData && posts && posts.length > 0) {
      const postBuckets = {}; 
      DAYS.forEach(d => postBuckets[d] = {});

      posts.forEach(post => {
        if (!post.timestamp) return;
        const d = new Date(post.timestamp);
        const day = DAYS[d.getDay()];
        const hour = d.getHours();
        const reach = post.insights?.reach || post.insights?.views || post.like_count || 0;
        
        if (!postBuckets[day][hour]) postBuckets[day][hour] = { reach: 0, count: 0 };
        postBuckets[day][hour].reach += reach;
        postBuckets[day][hour].count += 1;
      });

      DAYS.forEach(day => {
        if (weeklySchedule[day].length === 0) {
          const hours = Object.keys(postBuckets[day]).map(h => {
            const data = postBuckets[day][h];
            return { hour: parseInt(h, 10), val: data.reach / data.count };
          });
          
          if (hours.length > 0) {
            hours.sort((a, b) => b.val - a.val);
            weeklySchedule[day] = hours.slice(0, 3).map(x => x.hour).sort((a,b) => a - b);
          }
        }
      });
    }

    // 3. Absolute Fallback for empty days
    DAYS.forEach(day => {
      if (weeklySchedule[day].length === 0) {
        weeklySchedule[day] = FALLBACK_TIMES;
      } else while (weeklySchedule[day].length < 3) {
        // If they only have 1-2 times, pad with generic times that aren't already included
        const fallback = FALLBACK_TIMES.find(f => !weeklySchedule[day].includes(f));
        if (fallback !== undefined) weeklySchedule[day].push(fallback);
        else break;
        weeklySchedule[day].sort((a,b) => a - b);
      }
    });

    return weeklySchedule;
  }, [onlineData, posts]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel" 
      style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ 
          width: 48, height: 48, borderRadius: 'var(--r-md)', 
          background: 'var(--bg-elevated)', boxShadow: 'var(--neu-drop-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-color)'
        }}>
          <Calendar size={24} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-primary)' }}>Optimal Posting Schedule</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>Top 3 recommended times per day based on audience activity</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {DAYS.map(day => (
          <div key={day} style={{ 
            display: 'flex', alignItems: 'center', padding: '12px 16px',
            background: 'var(--bg-base)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--neu-inner-sm)'
          }}>
            <div style={{ width: 60, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              {day}
            </div>
            
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
              {schedule[day].map((hour, i) => (
                <div key={hour} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 20,
                  background: i === 0 ? 'var(--accent-color)' : 'var(--bg-elevated)',
                  color: i === 0 ? 'white' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: 700,
                  boxShadow: i === 0 ? '0 4px 12px rgba(92,107,250,0.3)' : 'var(--neu-drop-sm)'
                }}>
                  {i === 0 ? <Star size={12} fill="currentColor" /> : <Clock size={12} />}
                  {formatHour(hour)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
