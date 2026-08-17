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
 * Generates 5 natural, non-cringy comment options for a new reel.
 * Designed to sound like a genuine viewer, not a branded bot.
 */
export const generateReelComments = async (caption, handle) => {
  if (!model) throw new Error("Gemini API not configured.");

  const prompt = `
You are helping an Instagram creator craft a pinned comment on their own reel to boost engagement.

The comment must:
- Sound like it was written by a genuine, thoughtful viewer — NOT by the page owner promoting themselves
- Be subtle and natural. Never sound like a marketing copy or a CTA bot.
- Avoid hype words like "insane", "go viral", "🔥", "bro", "mind-blowing", "literally"
- NO direct "follow me" commands. Influence indirectly through curiosity or relatability.
- Be 1-2 sentences max. Lowercase is fine and often more authentic.
- Use at most one emoji, or none at all.
- Each comment should take a different angle: curiosity, perspective shift, a stat or fact callback, an existential question, or a quiet relatable reaction.

The creator's account handle is: ${handle}
The reel caption is: "${caption?.substring(0, 300) || 'A cosmic science reel'}"

Return EXACTLY 5 comment options as a JSON array of strings. No extra text, no explanation, just the raw JSON array.
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
