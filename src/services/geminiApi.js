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
 * Sends a generic prompt to the AI, along with optional dashboard context.
 */
export const askDashboardAI = async (prompt, contextData) => {
  if (!model) throw new Error("Gemini API not configured.");
  
  const systemContext = `
You are a highly intelligent, Neo-Brutalist Instagram Strategist. 
Be concise, punchy, and direct in your advice. Don't use overly flowery language.
Here is the user's current Instagram data context:
${JSON.stringify(contextData, null, 2)}
  `;

  const fullPrompt = `${systemContext}\n\nUser Question: ${prompt}`;
  
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
   - Bonus: imply the answer is HIDDEN somewhere in the video itself ("rewatch the last 3 seconds," "you missed it if you blinked," "the answer's in frame 2") — this pulls people back into the video instead of just scrolling to comments.

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
