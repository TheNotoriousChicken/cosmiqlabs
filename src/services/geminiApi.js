import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
