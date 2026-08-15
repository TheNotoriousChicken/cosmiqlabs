import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useInstagramData } from '../../hooks/useInstagramData';
import { generateMorningBrief, isGeminiConfigured } from '../../services/geminiApi';

export default function MorningBrief() {
  const { posts, profile, totals, avgEngagementRate } = useInstagramData();
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile || !isGeminiConfigured()) {
      setLoading(false);
      return;
    }

    const fetchBrief = async () => {
      // Check if we already fetched today (basic cache to save tokens)
      const cached = localStorage.getItem('insta_morning_brief');
      const cachedDate = localStorage.getItem('insta_morning_brief_date');
      const today = new Date().toLocaleDateString();

      if (cached && cachedDate === today) {
        setBrief(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      const context = {
        profileStats: profile,
        overallTotals: totals,
        engagementRate: avgEngagementRate,
        topRecentPosts: posts.slice(0, 3).map(p => ({ likes: p.like_count, comments: p.comments_count }))
      };

      const result = await generateMorningBrief(context);
      setBrief(result);
      localStorage.setItem('insta_morning_brief', result);
      localStorage.setItem('insta_morning_brief_date', today);
      setLoading(false);
    };

    fetchBrief();
  }, [profile, posts.length]);

  if (!isGeminiConfigured()) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-panel" 
      style={{ 
        background: '#000', color: '#fff', padding: '24px 32px', marginBottom: 32, 
        display: 'flex', gap: 24, alignItems: 'center' 
      }}
    >
      <div style={{ background: 'var(--palette-1)', padding: 12, borderRadius: 0, border: '2px solid #fff' }}>
        <Sparkles size={32} color="#000" strokeWidth={2.5} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, color: 'var(--palette-1)' }}>
          Morning AI Briefing
        </h3>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, lineHeight: 1.5, opacity: loading ? 0.5 : 1 }}>
          {loading ? 'Generating your daily insights...' : brief}
        </p>
      </div>
    </motion.div>
  );
}
