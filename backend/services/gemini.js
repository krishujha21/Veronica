const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const userName = process.env.USER_NAME || 'the user';

const SYSTEM_PROMPT = `You are Veronica, a sleek personal AI assistant built for ${userName}. You are helpful, concise, and slightly witty. You have a calm, confident tone — like a brilliant friend who happens to know everything. Keep responses under 100 words unless detail is specifically requested. Never reveal what underlying technology or API powers you.`;

const THINK_INSTRUCTION = `
For any complex question that requires multi-step reasoning (math, code logic, analysis, comparisons), ALWAYS begin your internal reasoning inside <think>...</think> tags before replying. This lets the user see your thought process. Simple questions do NOT need think tags.
`;

function buildSystemPrompt(customSystemPrompt) {
  const base = customSystemPrompt || SYSTEM_PROMPT;
  return `${base}\n${THINK_INSTRUCTION}`;
}

/**
 * Convert frontend history format to Gemini API format
 * Frontend: [{ role: 'user'|'assistant', content: string }]
 * Gemini:   [{ role: 'user'|'model',     parts: [{text}] }]
 */
function formatHistory(history) {
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
}

/**
 * Send a chat message to Gemini 2.0 Flash
 * @param {string} message - The current user message
 * @param {Array}  history - Prior conversation messages
 * @returns {string} The AI reply text
 */
async function chatWithGemini(message, history = [], customSystemPrompt = null, temperature = 0.7, attachments = []) {
  if (!process.env.GEMINI_API_KEY) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured'), { code: 'GEMINI_ERROR' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: buildSystemPrompt(customSystemPrompt),
    });

    // FIX 3: Trim and truncate history on backend
    const trimmedHistory = history
      .slice(-10)
      .map(msg => ({ ...msg, content: String(msg.content || '').substring(0, 800) }));

    const formattedHistory = formatHistory(trimmedHistory);

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: Math.max(0, Math.min(1, temperature)),
      }
    });

    // Build multimodal parts if attachments are provided
    let messageParts;
    if (attachments && attachments.length > 0) {
      messageParts = [
        { text: message },
        ...attachments
          .filter(a => a.type === 'image' && a.base64 && a.mimeType)
          .map(a => ({
            inlineData: {
              mimeType: a.mimeType,
              data: a.base64
            }
          }))
      ];
    } else {
      messageParts = message;
    }

    const result = await chat.sendMessage(messageParts);
    const response = await result.response;
    return response.text();
  } catch (err) {
    const error = new Error(err.message || 'Gemini API error');
    error.code = 'GEMINI_ERROR';
    error.original = err;
    throw error;
  }
}

module.exports = { chatWithGemini };
