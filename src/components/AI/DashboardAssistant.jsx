import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useInstagramData } from '../../hooks/useInstagramData';
import { askDashboardAI, isGeminiConfigured } from '../../services/geminiApi';
import toast from 'react-hot-toast';


// Simple markdown -> HTML renderer
function renderMarkdown(text) {
  return text
    // Headers
    .replace(/^### (.+)$/gm, '<h4 style="margin:10px 0 4px;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:12px 0 4px;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="margin:12px 0 6px;font-size:15px;font-weight:900;text-transform:uppercase;">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Bullet points
    .replace(/^\* (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:3px 0;padding-left:4px;">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li.*<\/li>)/gs, '<ul style="margin:6px 0;padding-left:16px;list-style:disc;">$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

export default function DashboardAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hey! I am your AI Strategist. Ask me anything about your Instagram performance.' }]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  const { posts, profile, totals, avgEngagementRate } = useInstagramData();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !isGeminiConfigured()) {
      if (!isGeminiConfigured()) toast.error('Gemini API is not configured.');
      return;
    }

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsThinking(true);

    try {
      // Build context from dashboard data
      const context = {
        profileStats: profile,
        overallTotals: totals,
        engagementRate: avgEngagementRate,
        recentPostsCount: posts.length,
        // Send a summarized version of top posts to save tokens
        topPosts: [...posts]
          .sort((a, b) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count))
          .slice(0, 5)
          .map(p => ({
            caption: p.caption?.substring(0, 100),
            likes: p.like_count,
            comments: p.comments_count,
            reach: p.insights?.reach || 0,
            views: p.insights?.views || 0,
          }))
      };

      const aiResponse = await askDashboardAI(userText, context);
      setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Whoops! Something went wrong communicating with the AI. Check console for details.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: 32, right: 32, zIndex: 9998,
          background: 'var(--palette-2)', padding: 16, borderRadius: '50%',
          border: '3px solid #000', boxShadow: '4px 4px 0px #000', cursor: 'pointer',
          display: isOpen ? 'none' : 'flex'
        }}
      >
        <Sparkles size={28} strokeWidth={2.5} color="#000" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: 32, right: 32, zIndex: 9999,
              width: 380, height: 600, background: '#fff',
              border: '3px solid #000', boxShadow: '8px 8px 0px #000',
              display: 'flex', flexDirection: 'column',
              fontFamily: 'Inter, sans-serif'
            }}
          >
            <div style={{ background: 'var(--palette-2)', padding: '16px 20px', borderBottom: '3px solid #000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Sparkles size={20} color="#000" />
                <span style={{ fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1 }}>AI Strategist</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16, background: '#f5f5f5' }}>
              {!isGeminiConfigured() && (
                <div style={{ background: '#ff4d4f', color: '#fff', padding: 12, border: '2px solid #000', fontWeight: 700, fontSize: 12 }}>
                  Warning: Gemini API Key is missing from .env. The AI will not function.
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{ 
                    background: m.role === 'user' ? '#000' : 'var(--palette-1)',
                    color: m.role === 'user' ? '#fff' : '#000',
                    padding: '12px 16px',
                    border: '2px solid #000',
                    borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    fontWeight: 500, fontSize: 14, lineHeight: 1.5,
                    boxShadow: '2px 2px 0px rgba(0,0,0,0.2)'
                  }}>
                    {m.role === 'ai' ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                    ) : (
                      m.text
                    )}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--palette-1)', padding: '12px 16px', border: '2px solid #000', borderRadius: '12px 12px 12px 0', fontWeight: 600, fontSize: 12 }}>
                  Analyzing data...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: 16, borderTop: '3px solid #000', background: '#fff', display: 'flex', gap: 12 }}>
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask for advice..."
                style={{
                  flex: 1, padding: '12px 16px', border: '2px solid #000', outline: 'none',
                  fontSize: 14, fontWeight: 500, background: '#f5f5f5'
                }}
              />
              <button 
                onClick={handleSend}
                disabled={isThinking}
                style={{
                  background: 'var(--palette-3)', border: '2px solid #000', padding: '0 16px',
                  cursor: isThinking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Send size={20} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
