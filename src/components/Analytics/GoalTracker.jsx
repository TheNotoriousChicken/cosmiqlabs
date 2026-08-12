import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Calendar, Edit2, Check } from 'lucide-react';
import { useInstagramData } from '../../hooks/useInstagramData';
import confetti from 'canvas-confetti';

export default function GoalTracker() {
  const { profile, followerHistory } = useInstagramData();
  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem('follower_goal') || '1000', 10));
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal.toString());

  const currentFollowers = profile?.followers_count || 0;
  
  useEffect(() => {
    if (currentFollowers > 0 && currentFollowers >= goal) {
      const hasCelebrated = localStorage.getItem(`celebrated_goal_${goal}`);
      if (!hasCelebrated) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#5C6BFA', '#00f2fe', '#4facfe']
        });
        localStorage.setItem(`celebrated_goal_${goal}`, 'true');
      }
    }
  }, [currentFollowers, goal]);

  const saveGoal = () => {
    const newGoal = parseInt(tempGoal, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      localStorage.setItem('follower_goal', newGoal.toString());
    }
    setIsEditing(false);
  };

  // Calculate prediction
  let avgDailyGrowth = 0;
  let predictedDate = null;

  if (followerHistory.length >= 2) {
    const recentHistory = followerHistory.slice(-30); // Last 30 days
    if (recentHistory.length >= 2) {
      const first = recentHistory[0];
      const last = recentHistory[recentHistory.length - 1];
      const daysDiff = (new Date(last.timestamp) - new Date(first.timestamp)) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 0) {
        avgDailyGrowth = (last.followers - first.followers) / daysDiff;
      }
    }
  }

  if (avgDailyGrowth > 0 && currentFollowers < goal) {
    const followersNeeded = goal - currentFollowers;
    const daysNeeded = followersNeeded / avgDailyGrowth;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Math.ceil(daysNeeded));
    predictedDate = futureDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const progress = Math.min((currentFollowers / goal) * 100, 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div className="brutal-panel" style={{ padding: 24, flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={18} color="var(--accent-color)" /> Next Milestone
        </h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Edit2 size={16} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Goal Details */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 300 }}>
              <input 
                type="number" 
                value={tempGoal} 
                onChange={e => setTempGoal(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}
                autoFocus
              />
              <button onClick={saveGoal} style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer' }}>
                <Check size={16} />
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-1px' }}>
                {goal.toLocaleString()}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {currentFollowers.toLocaleString()} / {goal.toLocaleString()} followers
              </div>
            </div>
          )}
          
          {!isEditing && (
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--accent-color)' }}>
              {Math.floor(progress)}%
            </div>
          )}
        </div>

        {/* Linear Progress Bar */}
        <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--r-full)', height: 16, overflow: 'hidden', boxShadow: 'var(--neu-inner-sm)' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--accent-color)',
            borderRadius: 'var(--r-full)',
            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
        </div>

        {/* Prediction */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Calendar size={14} />
          {currentFollowers >= goal ? (
            <span style={{ color: 'var(--success)' }}>Goal achieved! Set a new one.</span>
          ) : predictedDate ? (
            <span>Projected to hit on <strong>{predictedDate}</strong></span>
          ) : (
            <span>Need more data to predict date</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
