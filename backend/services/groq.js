const Groq = require('groq-sdk');

// Lazy — only create client when actually needed
let _client = null;
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _client;
}

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
 * Build the message array, injecting image parts when attachments exist.
 * For vision models, content is an array of parts; otherwise a plain string.
 */
function buildMessages(message, history, customSystemPrompt, attachments = []) {
  const trimmedHistory = history
    .slice(-10)
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content || '').substring(0, 800)
    }));

  const imageAttachments = attachments.filter(a => a.type === 'image' && a.base64 && a.mimeType);

  // Build user content: multimodal array if images present, plain string otherwise
  let userContent;
  if (imageAttachments.length > 0) {
    userContent = [
      { type: 'text', text: message },
      ...imageAttachments.map(a => ({
        type: 'image_url',
        image_url: {
          url: `data:${a.mimeType};base64,${a.base64}`
        }
      }))
    ];
  } else {
    userContent = message;
  }

  return [
    { role: 'system', content: buildSystemPrompt(customSystemPrompt) },
    ...trimmedHistory,
    { role: 'user', content: userContent }
  ];
}

/**
 * Send a chat message via Groq — standard (non-streaming)
 * Automatically uses llama-3.2-11b-vision-preview when images are attached.
 */
async function chatWithGroq(message, history = [], customSystemPrompt = null, temperature = 0.7, attachments = []) {
  if (!process.env.GROQ_API_KEY) {
    throw Object.assign(new Error('GROQ_API_KEY is not configured'), { code: 'GROQ_ERROR' });
  }

  const hasImages = attachments.filter(a => a.type === 'image').length > 0;
  const model = hasImages ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  const messages = buildMessages(message, history, customSystemPrompt, attachments);

  try {
    const response = await getClient().chat.completions.create({
      model,
      messages,
      max_tokens: 512,
      temperature: Math.max(0, Math.min(1, temperature)),
    });

    return response.choices[0].message.content;
  } catch (err) {
    const error = new Error(err.message || 'Groq API error');
    error.code = 'GROQ_ERROR';
    error.original = err;
    throw error;
  }
}

/**
 * Stream a chat response via Groq
 * Automatically uses llama-3.2-11b-vision-preview when images are attached.
 */
async function streamWithGroq(message, history = [], customSystemPrompt = null, temperature = 0.7, attachments = []) {
  if (!process.env.GROQ_API_KEY) {
    throw Object.assign(new Error('GROQ_API_KEY is not configured'), { code: 'GROQ_ERROR' });
  }

  const hasImages = attachments.filter(a => a.type === 'image').length > 0;
  const model = hasImages ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  const messages = buildMessages(message, history, customSystemPrompt, attachments);

  const stream = await getClient().chat.completions.create({
    model,
    messages,
    max_tokens: 512,
    temperature: Math.max(0, Math.min(1, temperature)),
    stream: true,
  });

  return stream;
}

module.exports = { chatWithGroq, streamWithGroq };
