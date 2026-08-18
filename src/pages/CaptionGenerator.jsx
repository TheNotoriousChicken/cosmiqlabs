import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { generateCaption } from '../services/geminiApi';
import { useInstagramData } from '../hooks/useInstagramData';
import toast from 'react-hot-toast';

const VIBE_OPTIONS = [
  { value: 'cold, authoritative, mind-bending', label: 'Cold & Authoritative' },
  { value: 'curious and unsettling — makes you question reality', label: 'Curious & Unsettling' },
  { value: 'poetic and vast — the scale is the emotion', label: 'Poetic & Vast' },
  { value: 'clinical and factual — no emotion, just scale', label: 'Clinical & Factual' },
];

const CTA_OPTIONS = [
  { value: 'soft — make them curious, not commanded', label: 'Soft Curiosity' },
  { value: 'none — let the content speak, zero CTA', label: 'No CTA' },
  { value: 'urgency-based — they will miss something if they do not follow', label: 'Urgency-Based' },
];

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function CaptionGenerator() {
  const { profile } = useInstagramData();
  const handle = profile?.username ? `@${profile.username}` : '@cosmiq.labs';

  const [topic, setTopic] = useState('');
  const [hook, setHook] = useState('');
  const [vibe, setVibe] = useState(VIBE_OPTIONS[0].value);
  const [cta, setCta] = useState(CTA_OPTIONS[0].value);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic first.'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await generateCaption({ topic, hook, vibe, cta, accountHandle: handle });
      setResult(res);
    } catch (e) {
      toast.error(e.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const full = `${result.caption}\n\n${result.hashtags}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="brutal-panel" style={{ padding: '28px 32px', marginBottom: 32, background: 'var(--palette-2)', border: '3px solid #000', boxShadow: '6px 6px 0 #000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <Sparkles size={28} strokeWidth={2.5} />
          <h1 style={{ fontSize: 28, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Caption Generator</h1>
        </div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, opacity: 0.8 }}>
          AI-engineered captions for {handle} — tuned for scroll-stopping hooks and niche authority.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* LEFT — Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Topic */}
          <div className="brutal-panel" style={{ padding: 24 }}>
            <label style={{ display: 'block', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Topic / Concept *
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. The heat death of the universe and what it means for time itself"
              rows={3}
              style={{
                width: '100%', padding: '12px 16px', border: '2px solid #000',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                background: '#f9f9f9',
              }}
            />
          </div>

          {/* Hook angle */}
          <div className="brutal-panel" style={{ padding: 24 }}>
            <label style={{ display: 'block', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Hook Angle <span style={{ fontWeight: 500, opacity: 0.6 }}>(optional)</span>
            </label>
            <input
              value={hook}
              onChange={e => setHook(e.target.value)}
              placeholder="e.g. Frame it through the lens of a human lifetime vs cosmic time"
              style={{
                width: '100%', padding: '12px 16px', border: '2px solid #000',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                outline: 'none', boxSizing: 'border-box', background: '#f9f9f9',
              }}
            />
          </div>

          {/* Vibe */}
          <div className="brutal-panel" style={{ padding: 24 }}>
            <label style={{ display: 'block', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Vibe
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VIBE_OPTIONS.map(v => (
                <button
                  key={v.value}
                  onClick={() => setVibe(v.value)}
                  style={{
                    textAlign: 'left', padding: '10px 14px',
                    border: vibe === v.value ? '3px solid #000' : '2px solid #ccc',
                    background: vibe === v.value ? 'var(--palette-1)' : '#fff',
                    fontWeight: vibe === v.value ? 800 : 500, fontSize: 13, cursor: 'pointer',
                    boxShadow: vibe === v.value ? '3px 3px 0 #000' : 'none',
                    transition: 'all 0.12s',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Style */}
          <div className="brutal-panel" style={{ padding: 24 }}>
            <label style={{ display: 'block', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              CTA Style
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CTA_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCta(c.value)}
                  style={{
                    textAlign: 'left', padding: '10px 14px',
                    border: cta === c.value ? '3px solid #000' : '2px solid #ccc',
                    background: cta === c.value ? 'var(--palette-3)' : '#fff',
                    fontWeight: cta === c.value ? 800 : 500, fontSize: 13, cursor: 'pointer',
                    boxShadow: cta === c.value ? '3px 3px 0 #000' : 'none',
                    transition: 'all 0.12s',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            style={{
              width: '100%', padding: '16px 0',
              background: loading || !topic.trim() ? '#ccc' : 'var(--palette-2)',
              border: '3px solid #000',
              boxShadow: loading || !topic.trim() ? 'none' : '5px 5px 0 #000',
              fontWeight: 900, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1,
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.15s',
            }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</> : <><Sparkles size={18} /> Generate Caption</>}
          </button>
        </div>

        {/* RIGHT — Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!result && !loading && (
            <div className="brutal-panel" style={{ padding: 48, textAlign: 'center', border: '2px dashed #ccc', background: '#fafafa' }}>
              <Sparkles size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p style={{ fontWeight: 700, fontSize: 14, opacity: 0.4, margin: 0 }}>
                Fill in the topic and hit Generate.<br />Your caption will appear here.
              </p>
            </div>
          )}

          {loading && (
            <div className="brutal-panel" style={{ padding: 48, textAlign: 'center', border: '2px solid #000' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Writing your caption...</p>
            </div>
          )}

          {result && (
            <>
              {/* Hook line callout */}
              <div style={{
                padding: '14px 20px', background: 'var(--palette-2)',
                border: '3px solid #000', boxShadow: '4px 4px 0 #000',
              }}>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Hook Line
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.5 }}>{result.hook_line}</div>
              </div>

              {/* Full caption */}
              <div className="brutal-panel" style={{ padding: 24 }}>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                  Full Caption
                </div>
                <div style={{
                  fontWeight: 500, fontSize: 14, lineHeight: 1.8,
                  whiteSpace: 'pre-wrap', borderLeft: '3px solid #000', paddingLeft: 16,
                }}>
                  {result.caption}
                </div>
              </div>

              {/* Hashtags */}
              <div className="brutal-panel" style={{ padding: 20, background: '#f5f5f5' }}>
                <div style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Hashtags
                </div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#555', letterSpacing: 0.5 }}>
                  {result.hashtags}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={handleGenerate}
                  style={{
                    flex: 1, padding: '12px 0', background: '#fff',
                    border: '2px solid #000', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <RefreshCw size={14} /> Regenerate
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    flex: 2, padding: '12px 0',
                    background: copied ? 'var(--palette-3)' : 'var(--palette-2)',
                    border: '3px solid #000', fontWeight: 900, fontSize: 13,
                    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
                    boxShadow: '3px 3px 0 #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {copied ? <><CheckCircle size={15} /> Copied!</> : <><Copy size={15} /> Copy Caption + Tags</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
