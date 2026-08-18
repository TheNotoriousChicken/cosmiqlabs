import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
}

export const isGeminiConfigured = () => !!model;

/**
 * Sends a prompt to the AI Strategist with full dashboard context injected.
 */
export const askDashboardAI = async (prompt, contextData) => {
  if (!model) throw new Error("Gemini API not configured.");
  
  const systemContext = `
You are TJ's Instagram Growth Mentor — a sharp, experienced strategist who has scaled niche content pages before. You don't just give orders; you explain the "why" behind every recommendation so TJ actually learns the game, not just follows commands.

HOW YOU OPERATE:
- Ground every piece of advice in the actual data provided. Never invent numbers, trends, or specifics that aren't in the data. If the data doesn't cover something, say so plainly instead of guessing.
- Lead with the recommendation, then the reasoning in 1-2 sentences. Skip the padding.
- When something in the data is underperforming, name it directly and explain the likely cause before prescribing a fix.
- When something is working, say why it's working so it can be repeated deliberately, not by luck.
- Use concrete numbers from the data whenever possible rather than vague praise or criticism.
- If TJ asks a strategic question with no clear data-backed answer, say what you'd test next and why — don't fabricate certainty.

TONE:
- Direct, confident, mentor-to-founder — not a hype man, not a corporate consultant.
- No flowery language, no motivational filler, no emoji unless functionally useful (e.g. flagging a metric).
- Assume TJ is capable and can handle straight feedback, including "this isn't working."

OUTPUT STYLE:
- Short paragraphs or tight bullet points. No walls of text.
- End with one clear next action when the question calls for it — not a list of five options TJ has to choose between themselves.

TJ's current Instagram data context:
${JSON.stringify(contextData, null, 2)}
  `;

  const fullPrompt = `${systemContext}\n\nTJ's Question: ${prompt}`;
  
  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to get response from AI Strategist.");
  }
};


/**
 * Generates a short 2-3 sentence morning briefing based on recent performance.
 */
export const generateMorningBrief = async (contextData) => {
  if (!model) return "AI Strategist is offline. Configure your API key to get daily insights.";

  const prompt = `
Analyze this Instagram data and provide a punchy, 2-sentence "Morning Briefing".
Focus on the most interesting metric or recent post performance. Suggest one quick actionable thing to do today.
Keep it strictly under 3 sentences. No pleasantries.
Data: ${JSON.stringify(contextData, null, 2)}
  `;

  try {
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (error) {
    console.error("Morning Brief Error:", error);
    return "Failed to generate morning briefing.";
  }
};

/**
 * Analyzes the vibe of comments on a specific post.
 */
export const analyzePostVibe = async (comments) => {
  if (!model) return "AI Offline";
  if (!comments || comments.length === 0) return "No comments to analyze";

  // To save tokens and time, only sample the first 50 comments if there are too many
  const sample = comments.slice(0, 50).map(c => c.text).join(' | ');

  const prompt = `
Analyze the vibe of these Instagram comments.
Return exactly one short phrase (max 4 words) that describes the overall sentiment. 
Examples: "Highly Positive", "Controversial Debate", "Spammy", "Lots of Love".
Comments: ${sample}
  `;

  try {
    const result = await model.generateContent(prompt);
    return (await result.response).text().trim();
  } catch (error) {
    console.error("Vibe Check Error:", error);
    return "Unknown Vibe";
  }
};
/**
 * Generates 5 high-conversion pinned comment options for a new reel.
 * Uses an engineered brutalist growth-hacker prompt for @cosmiq.labs.
 */
export const generateReelComments = async (caption, handle) => {
  if (!model) throw new Error("Gemini API not configured.");

  const prompt = `
Act as a high-conversion growth hacker for ${handle} (niche: mind-bending space, astrophysics, cosmic scale).

Write a pinned comment for a new Reel with this caption:
"${caption?.substring(0, 400) || 'A mind-bending cosmic science reel'}"

GOAL: Maximize watch-time (rewatch behavior) + trigger an IMMEDIATE follow (not "maybe later").

STRUCTURE (strict 3-part brutalist format):

1. THE HOOK (Retention Trigger)
   - Drop an existential question or unresolved fact tied to the topic.
   - Must NOT repeat the caption.
   - Use VAGUE rewatch triggers that cannot be fact-checked — NEVER reference specific timestamps, frames, seconds, or visual details ("at 0:03," "top right corner," "frame 2") — these get caught as fake.
   - Instead use: "watch it again knowing that—", "your eyes glossed over the part that matters," "you weren't looking for it, so you missed it," "go back in — slower this time."
   - The mystery lives in the FACT or QUESTION, not in a fake video detail.

2. THE CTA (Instant-Follow, not soft-follow)
   - Frame following as the ONLY way to not miss what's coming — urgency + scarcity, not politeness.
   - Use command verbs: "Follow before—", "Don't scroll past—", "Last chance to—"
   - Imply a countdown/series logic: "Part 2 drops before you're ready for it."
   - Avoid passive asks like "follow for more" — replace with consequence-framed commands ("miss this and you're behind").

3. THE VIBE
   - Short. Cold. Authoritative — like a warning, not an invitation.
   - Max 1 emoji, only from: 🌌 💀 👁️
   - Zero enthusiasm punctuation (no "!!"). Periods or em-dashes only.
   - No friendly tone, no explaining the joke.

CONSTRAINTS:
- Under 150 characters per variation
- No repeated caption phrasing
- No generic CTAs
- Output 5 distinct variations, numbered

Return EXACTLY 5 comment options as a JSON array of strings. No extra text, no numbering, no explanation outside the array.
Each string is the full comment (Hook + CTA merged naturally, under 150 chars).
Example format: ["comment 1", "comment 2", "comment 3", "comment 4", "comment 5"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    // Extract JSON array from the response
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Invalid response format");
    const comments = JSON.parse(match[0]);
    if (!Array.isArray(comments) || comments.length === 0) throw new Error("Empty array");
    return comments.slice(0, 5);
  } catch (error) {
    console.error("Reel Comment Generation Error:", error);
    throw new Error("Failed to generate comment options.");
  }
};

// ─── 1. CAPTION GENERATOR ────────────────────────────────────────────────────
export const generateCaption = async ({ topic, hook, vibe, cta, accountHandle }) => {
  if (!model) throw new Error('Gemini API not configured.');

  const prompt = `
You are a viral content writer for ${accountHandle} — a space/astrophysics/cosmic scale page.
Your captions have driven 900k+ views on a single reel. You understand the algorithm deeply.

TASK: Write an Instagram Reel caption based on:
- TOPIC: ${topic}
- HOOK ANGLE: ${hook || 'existential awe or scale that breaks the human brain'}
- VIBE: ${vibe || 'cold, authoritative, mind-bending'}
- CTA STYLE: ${cta || 'soft — make them curious, not commanded'}

CAPTION RULES:
- First line is the HOOK. Must stop the scroll. No fluff, no "Did you know". Drop them into the deep end.
- 3–5 lines max. Each line earns its place or gets cut.
- Do NOT use "imagine", "literally", "mind-blowing", "insane", "wow", "amazing".
- Use facts, scale, and unresolved questions. Leave one thing unanswered — the brain will come back for closure.
- Hashtags: 3–5 tight niche tags only. No mass tags. Format them on a new line at the end.
- No emoji in the body. One emoji max in the hashtag line.

Return a JSON object with exactly these keys:
{ "caption": "full caption text", "hashtags": "#tag1 #tag2 #tag3", "hook_line": "just the first line" }
No extra text outside the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid format');
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Caption Gen Error:', e);
    throw new Error('Failed to generate caption.');
  }
};

// ─── 2. BEST TIME TO POST ────────────────────────────────────────────────────
export const analyzeBestPostTime = async (onlineFollowersData, timezone = 'Asia/Kolkata') => {
  if (!model) throw new Error('Gemini API not configured.');
  if (!onlineFollowersData || onlineFollowersData.length === 0) throw new Error('No heatmap data available.');

  const prompt = `
You are analyzing Instagram follower activity data for a creator in ${timezone}.

DATA: This is an array of hourly online follower counts across multiple days.
${JSON.stringify(onlineFollowersData.slice(0, 30), null, 2)}

TASK: Identify the single best posting window — the day(s) and hour(s) when the creator's audience is most active and most likely to engage immediately after posting (which signals the algorithm to distribute further).

RULES:
- Be specific. "Post on weekday evenings" is useless. "Post between 8–9pm IST on Tuesday and Thursday" is actionable.
- Explain the pattern you see in the data in 1 sentence.
- Flag any secondary window worth testing if it's notably strong.
- If data is too sparse or noisy to be confident, say so directly.

Return a JSON object:
{
  "primary_window": "e.g. Tuesday–Thursday, 8–9pm IST",
  "why": "1-sentence explanation of the data pattern",
  "secondary_window": "e.g. Saturday 10am IST (secondary spike)" or null,
  "confidence": "high | medium | low",
  "data_note": "any caveat about data quality or sample size" or null
}
No extra text outside the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid format');
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Best Time Error:', e);
    throw new Error('Failed to analyze posting times.');
  }
};

// ─── 3. POST PERFORMANCE EXPLAINER ───────────────────────────────────────────
export const explainPostPerformance = async (post, accountAverages) => {
  if (!model) throw new Error('Gemini API not configured.');

  const prompt = `
You are TJ's Instagram Growth Mentor. Diagnose why a specific post performed the way it did.

THIS POST:
${JSON.stringify(post, null, 2)}

ACCOUNT AVERAGES (for comparison):
${JSON.stringify(accountAverages, null, 2)}

TASK: Explain this post's performance relative to the account average. Be a diagnostician, not a cheerleader.

STRUCTURE YOUR RESPONSE:
1. VERDICT (1 line): Outperformed / Underperformed / In-line — by how much vs average.
2. LIKELY CAUSE (2–3 bullets): What specifically drove or hurt performance. Reference actual numbers.
3. REPEAT OR AVOID (1 line): Should TJ replicate this format/topic, or kill it?

RULES:
- Use the actual numbers. Don't say "good engagement" — say "4.2% ER vs 1.8% average."
- If data is missing (e.g. no reach data), note it and work with what's there.
- No padding. No "great job." If it flopped, say it flopped and say why.
  `;

  try {
    const result = await model.generateContent(prompt);
    return (await result.response).text();
  } catch (e) {
    console.error('Performance Explainer Error:', e);
    throw new Error('Failed to analyze post performance.');
  }
};

// ─── 4. FOLLOWER GROWTH ANOMALY DETECTOR ─────────────────────────────────────
export const detectFollowerAnomalies = async (followerTimeline, recentPosts) => {
  if (!model) throw new Error('Gemini API not configured.');

  const prompt = `
You are analyzing an Instagram account's follower growth timeline to detect anomalies — unusual spikes or drops — and diagnose what caused them.

FOLLOWER TIMELINE (daily counts):
${JSON.stringify(followerTimeline, null, 2)}

RECENT POSTS (for correlation):
${JSON.stringify(recentPosts?.slice(0, 10).map(p => ({
    id: p.id,
    timestamp: p.timestamp,
    type: p.media_type,
    likes: p.like_count,
    comments: p.comments_count,
    views: p.insights?.views,
    caption_preview: p.caption?.substring(0, 80),
  })), null, 2)}

TASK: 
1. Identify any significant spikes or drops in follower count (>10% day-over-day change or sustained trend shifts).
2. Correlate each anomaly with nearby post activity if applicable.
3. Give a plain-language diagnosis for each anomaly.

Return a JSON array of anomaly objects:
[{
  "date": "YYYY-MM-DD",
  "type": "spike" | "drop" | "plateau",
  "magnitude": "e.g. +340 followers in 24h",
  "likely_cause": "plain-language explanation",
  "correlated_post": "post caption preview or null"
}]
If no significant anomalies, return an empty array [].
No extra text outside the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Anomaly Detector Error:', e);
    throw new Error('Failed to analyze follower growth.');
  }
};

// ─── 5. DEMOGRAPHICS INSIGHT ─────────────────────────────────────────────────
export const analyzeDemographics = async (demographics, topPosts, handle) => {
  if (!model) throw new Error('Gemini API not configured.');

  const prompt = `
You are TJ's Instagram Growth Mentor. Analyze the audience demographics for ${handle} and translate raw data into actionable content strategy.

DEMOGRAPHICS DATA:
${JSON.stringify(demographics, null, 2)}

TOP PERFORMING POSTS (for context):
${JSON.stringify(topPosts?.slice(0, 5).map(p => ({
    type: p.media_type,
    likes: p.like_count,
    views: p.insights?.views,
    caption_preview: p.caption?.substring(0, 80),
  })), null, 2)}

TASK: Give TJ 3 sharp, data-grounded insights that change how they create or distribute content.

RULES:
- Each insight must reference a specific demographic data point.
- Connect the demographic to a content or distribution action — not a vague observation.
- Flag any mismatch between the audience and the content niche (e.g. unexpected geography, age skew).
- If the data suggests a platform-specific opportunity (e.g. Reels vs Stories for this age group), name it.

FORMAT:
Return a JSON array of exactly 3 insight objects:
[{
  "insight": "sharp 1-sentence finding",
  "data_point": "the specific demographic stat that supports it",
  "action": "concrete thing TJ should do differently"
}]
No extra text outside the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('Invalid format');
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Demographics Insight Error:', e);
    throw new Error('Failed to analyze demographics.');
  }
};

// ─── 6. ENGAGEMENT DROP ALERT ────────────────────────────────────────────────
export const analyzeEngagementDrop = async (engagementTimeline, recentPosts, followerCount) => {
  if (!model) throw new Error('Gemini API not configured.');

  const prompt = `
You are TJ's Instagram Growth Mentor diagnosing an engagement pattern on their account.

ENGAGEMENT TIMELINE (daily reach, impressions, engaged accounts):
${JSON.stringify(engagementTimeline, null, 2)}

RECENT POSTS:
${JSON.stringify(recentPosts?.slice(0, 8).map(p => ({
    timestamp: p.timestamp,
    type: p.media_type,
    likes: p.like_count,
    comments: p.comments_count,
    views: p.insights?.views,
    reach: p.insights?.reach,
  })), null, 2)}

FOLLOWER COUNT: ${followerCount}

TASK: Diagnose the current engagement health of this account.
- Is engagement trending up, down, or flat vs the data window?
- If there's a drop, what is the most likely cause? (post frequency change, content type shift, algorithm update timing, audience mismatch, etc.)
- What is the single most important lever TJ should pull right now?

Return a JSON object:
{
  "status": "healthy" | "declining" | "recovering" | "volatile",
  "trend_summary": "1-sentence description of the pattern",
  "likely_cause": "specific diagnosis of any drop/issue, or null if healthy",
  "engagement_rate": "calculated average ER from the data as a percentage",
  "action": "the single most important thing TJ should do right now"
}
No extra text outside the JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = (await result.response).text().trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Invalid format');
    return JSON.parse(match[0]);
  } catch (e) {
    console.error('Engagement Drop Error:', e);
    throw new Error('Failed to analyze engagement.');
  }
};
