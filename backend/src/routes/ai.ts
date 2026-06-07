import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// ─── Provider Initialization ─────────────────────────────────────────────────

// Gemini
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({});
} catch (error) {
  console.warn("Failed to initialize GoogleGenAI. Gemini will be unavailable.");
}

// Groq (OpenAI-compatible REST API — no SDK needed)
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // fast, free-tier model

// ─── Helpers ─────────────────────────────────────────────────────────────────

const hasGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  return !!(ai && key && key !== 'YOUR_GEMINI_API_KEY');
};

const hasGroq = () => {
  return !!(GROQ_API_KEY && GROQ_API_KEY !== 'YOUR_GROQ_API_KEY');
};

// Make sure at least ONE provider is configured
const checkAI = (req: any, res: any, next: any) => {
  if (!hasGemini() && !hasGroq()) {
    return res.status(500).json({
      error: 'No AI provider configured. Add GEMINI_API_KEY or GROQ_API_KEY to your backend/.env file.'
    });
  }
  next();
};

// ─── Groq helper ─────────────────────────────────────────────────────────────

async function callGroq(
  systemPrompt: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const body = {
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.8,
    max_tokens: 2048
  };

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Groq API error ${res.status}: ${JSON.stringify(errData)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

// ─── Gemini helpers ──────────────────────────────────────────────────────────

async function callGeminiSimple(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: { systemInstruction: systemPrompt }
  });
  return response.text || 'No response generated.';
}

async function callGeminiChat(systemPrompt: string, contents: any[]): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: contents,
    config: { systemInstruction: systemPrompt }
  });
  return response.text || 'No response generated.';
}

function isRateLimited(error: any): boolean {
  return error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
}

// ─── Unified generate with automatic fallback ────────────────────────────────

async function generateWithFallback(
  systemPrompt: string,
  groqMessages: { role: string; content: string }[],
  geminiCall: () => Promise<string>
): Promise<{ result: string; provider: string }> {

  // Try Gemini first if available
  if (hasGemini()) {
    try {
      const result = await geminiCall();
      return { result, provider: 'gemini' };
    } catch (err: any) {
      console.warn(`Gemini failed (${err.status || 'unknown'}), trying fallback...`);
      if (!isRateLimited(err) && !hasGroq()) {
        throw err; // non-rate-limit error and no fallback
      }
    }
  }

  // Fallback to Groq
  if (hasGroq()) {
    try {
      const result = await callGroq(systemPrompt, groqMessages);
      return { result, provider: 'groq' };
    } catch (err: any) {
      console.error('Groq fallback also failed:', err);
      throw err;
    }
  }

  throw new Error('All AI providers failed or are unavailable.');
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.post('/recommend', checkAI, async (req, res) => {
  try {
    const { prompt } = req.body;
    const systemPrompt = `You are AniSensei, an expert anime recommendation assistant. Based on the user's prompt, recommend 3-5 anime. Format your response clearly with titles, genres, and why each is a good fit.`;

    const { result, provider } = await generateWithFallback(
      systemPrompt,
      [{ role: 'user', content: prompt }],
      () => callGeminiSimple(systemPrompt, prompt)
    );

    res.json({ result, provider });
  } catch (error: any) {
    console.error('Recommend error:', error);
    res.status(500).json({ error: 'Failed to generate recommendation. All AI providers are unavailable.' });
  }
});

router.post('/compare', checkAI, async (req, res) => {
  try {
    const { character1, character2 } = req.body;
    const systemPrompt = 'You are AniSensei, an expert anime analyst.';
    const userPrompt = `Compare these two anime characters: ${character1} and ${character2}. Discuss their backgrounds, powers, and personalities. Provide a fun verdict on who would win in a friendly contest.`;

    const { result, provider } = await generateWithFallback(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      () => callGeminiSimple(systemPrompt, userPrompt)
    );

    res.json({ result, provider });
  } catch (error: any) {
    console.error('Compare error:', error);
    res.status(500).json({ error: 'Failed to generate comparison' });
  }
});

router.post('/quiz', checkAI, async (req, res) => {
  try {
    const { topic } = req.body;
    const systemPrompt = 'You are AniSensei, an anime quiz master.';
    const userPrompt = `Generate a 5-question multiple choice anime quiz about ${topic || 'general anime trivia'}. Return the response in a structured format with questions, choices, and the correct answer at the end.`;

    const { result, provider } = await generateWithFallback(
      systemPrompt,
      [{ role: 'user', content: userPrompt }],
      () => callGeminiSimple(systemPrompt, userPrompt)
    );

    res.json({ result, provider });
  } catch (error: any) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

router.post('/chat', checkAI, async (req, res) => {
  try {
    const { messages, characterContext } = req.body;

    let systemPrompt = "You are AniSensei, an AI anime companion. Be helpful and friendly. Keep responses relatively concise.";
    if (characterContext) {
      systemPrompt = `You are roleplaying strictly as the anime character ${characterContext}. Respond entirely in character, adopting their tone, personality, catchphrases, and perspective. Do not break character under any circumstances. If asked something you wouldn't know, respond as the character would. Keep responses conversational and engaging.`;
    }

    // Build Groq-compatible messages (always ready as fallback)
    let groqMessages: { role: string; content: string }[] = [];
    let geminiContents: any[] = [];

    if (messages && Array.isArray(messages)) {
      // Remove the initial bot greeting so Gemini gets user-first history
      let validMessages = messages;
      if (validMessages.length > 0 && validMessages[0].role === 'bot') {
        validMessages = validMessages.slice(1);
      }

      // Groq format (OpenAI-compatible)
      groqMessages = validMessages.map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.text
      }));

      // Gemini format
      geminiContents = validMessages.map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));
    } else if (req.body.message) {
      groqMessages = [{ role: 'user', content: req.body.message }];
      geminiContents = [{ role: 'user', parts: [{ text: req.body.message }] }];
    }

    const { result, provider } = await generateWithFallback(
      systemPrompt,
      groqMessages,
      () => callGeminiChat(systemPrompt, geminiContents)
    );

    res.json({ result, provider });
  } catch (error: any) {
    console.error('Chat error:', error);
    if (error.status === 400 || error.message?.includes('400')) {
      return res.status(400).json({ error: 'Conversation history error. Please click "Clear Chat" and try again.' });
    }
    res.status(500).json({ error: 'All AI providers failed. Please try again in a moment.' });
  }
});

export default router;
