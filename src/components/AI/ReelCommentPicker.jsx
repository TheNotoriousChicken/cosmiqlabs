import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Copy, CheckCircle, Loader2, Video } from 'lucide-react';
import { generateReelComments } from '../../services/geminiApi';
import { postComment } from '../../services/instagramApi';
import { useAppStore } from '../../store/useAppStore';
import toast from 'react-hot-toast';

export default function ReelCommentPicker({ reel, onDismiss, onDone }) {
  const { accessToken, profile } = useAppStore();
  const handle = profile?.username ? `@${profile.username}` : '@cosmiq.labs';

  const [stage, setStage] = useState('idle'); // idle | generating | picking | posting | done
  const [comments, setComments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [postedText, setPostedText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setStage('generating');
    try {
      const opts = await generateReelComments(reel.caption, handle);
      setComments(opts);
      setStage('picking');
    } catch (err) {
      toast.error('AI failed to generate comments. Try again.');
      setStage('idle');
    }
  };

  const handlePost = async () => {
    if (!selected) return;
    setStage('posting');
    try {
      await postComment(accessToken, reel.id, selected);
      setPostedText(selected);
      setStage('done');
      onDone(reel.id);
    } catch (err) {
      toast.error('Failed to post comment. Check your token permissions.');
      setStage('picking');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(postedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const thumbnail = reel.thumbnail_url || reel.media_url;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          style={{
            background: '#fff',
            border: '3px solid #000',
            boxShadow: '8px 8px 0px #000',
            width: '100%',
            maxWidth: 520,
            fontFamily: 'Inter, sans-serif',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'var(--palette-2)',
            padding: '16px 20px',
            borderBottom: '3px solid #000',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={20} strokeWidth={2.5} />
              <span style={{ fontWeight: 900, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>
                New Reel Detected
              </span>
            </div>
            <button onClick={onDismiss} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={22} strokeWidth={3} />
            </button>
          </div>

          <div style={{ padding: 20 }}>
            {/* Reel preview */}
            <div style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: 16, border: '2px solid #000', background: '#f5f5f5',
              marginBottom: 20,
            }}>
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="reel thumbnail"
                  style={{ width: 64, height: 88, objectFit: 'cover', border: '2px solid #000', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 64, height: 88, background: '#ddd', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={24} />
                </div>
              )}
              <div>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Caption
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: '#333' }}>
                  {reel.caption ? reel.caption.substring(0, 140) + (reel.caption.length > 140 ? '…' : '') : 'No caption'}
                </p>
              </div>
            </div>

            {/* Stage: idle */}
            {stage === 'idle' && (
              <button
                onClick={handleGenerate}
                style={{
                  width: '100%', padding: '14px 0',
                  background: 'var(--palette-2)', border: '3px solid #000',
                  fontWeight: 900, fontSize: 15, textTransform: 'uppercase',
                  cursor: 'pointer', boxShadow: '4px 4px 0 #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  letterSpacing: 1,
                }}
              >
                <Sparkles size={18} /> Generate 5 Comment Options
              </button>
            )}

            {/* Stage: generating */}
            {stage === 'generating' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30, background: '#f5f5f5', border: '2px solid #000' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>AI is crafting options...</span>
              </div>
            )}

            {/* Stage: picking */}
            {stage === 'picking' && (
              <div>
                <div style={{ fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  Pick one to post as your pinned comment:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {comments.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(c)}
                      style={{
                        textAlign: 'left', padding: '12px 16px',
                        border: selected === c ? '3px solid #000' : '2px solid #ccc',
                        background: selected === c ? 'var(--palette-1)' : '#fff',
                        cursor: 'pointer', fontWeight: selected === c ? 700 : 500,
                        fontSize: 14, lineHeight: 1.5,
                        boxShadow: selected === c ? '3px 3px 0 #000' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleGenerate}
                    style={{
                      flex: 1, padding: '12px 0', background: '#fff',
                      border: '2px solid #000', fontWeight: 700, fontSize: 13,
                      cursor: 'pointer', textTransform: 'uppercase',
                    }}
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={!selected}
                    style={{
                      flex: 2, padding: '12px 0',
                      background: selected ? 'var(--palette-2)' : '#ccc',
                      border: '3px solid #000', fontWeight: 900, fontSize: 13,
                      cursor: selected ? 'pointer' : 'not-allowed',
                      textTransform: 'uppercase', letterSpacing: 1,
                      boxShadow: selected ? '3px 3px 0 #000' : 'none',
                    }}
                  >
                    Post Comment
                  </button>
                </div>
              </div>
            )}

            {/* Stage: posting */}
            {stage === 'posting' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30, background: '#f5f5f5', border: '2px solid #000' }}>
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Posting comment...</span>
              </div>
            )}

            {/* Stage: done */}
            {stage === 'done' && (
              <div>
                <div style={{
                  padding: 16, background: 'var(--palette-3)', border: '2px solid #000',
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                }}>
                  <CheckCircle size={22} strokeWidth={2.5} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Comment posted successfully!</span>
                </div>
                <div style={{ padding: 14, background: '#f5f5f5', border: '2px dashed #000', marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
                  "{postedText}"
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#555', marginBottom: 12 }}>
                  📌 To pin this: open Instagram → go to your reel → tap the comment → tap "Pin"
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: copied ? 'var(--palette-3)' : 'var(--palette-2)',
                    border: '3px solid #000', fontWeight: 900, fontSize: 13,
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
                    boxShadow: '3px 3px 0 #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <Copy size={16} />
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
