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
