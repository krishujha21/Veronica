const { chatWithGroq, streamWithGroq } = require('./groq');
const { chatWithGemini } = require('./gemini');
const { chatWithClaude } = require('./claude');
const { chatWithMistral, streamWithMistral } = require('./mistral');
const codestral = require('./codestral');

/* ── Coding-related trigger keywords ── */
const CODESTRAL_TRIGGERS = [
  'code', 'debug', 'fix', 'error', 'function', 'class',
  'algorithm', 'script', 'program', 'bug', 'syntax',
  'javascript', 'python', 'react', 'node', 'css', 'html',
  'api', 'database', 'sql', 'git', 'terminal', 'bash', 'write a'
];

/**
 * Standard (non-streaming) router
 */
async function routeChat(message, history = [], requestedModel = 'groq', customSystemPrompt = null, temperature = 0.7, attachments = []) {
  const start = Date.now();
  
  // Note: customSystemPrompt already includes the User Bio injected by the chat route.
  const effectiveSystemPrompt = customSystemPrompt || '';

  /* ── Auto-route coding queries to Codestral ── */
  const codestralAvailable = process.env.MISTRAL_API_KEY &&
    process.env.MISTRAL_API_KEY.length > 10;
  const isCodeTask = CODESTRAL_TRIGGERS.some(t =>
    message.toLowerCase().includes(t));

  // If there are image attachments, skip Codestral auto-routing (not vision capable)
  if (codestralAvailable && isCodeTask && attachments.length === 0) {
    try {
      const reply = await codestral.chat(message, history, null, temperature);
      return { reply, model: 'Codestral', latency: Date.now() - start };
    } catch (err) {
      console.error('[Codestral FAILED - falling through]:', err.message);
    }
  }

  const providers = {
    'groq':      { name: 'Groq (Llama 3)',       fn: (m, h, s, t) => chatWithGroq(m, h, s, t, attachments)    },
    'gemini':    { name: 'Gemini 2.0 Flash',    fn: (m, h, s, t) => chatWithGemini(m, h, s, t, attachments)  },
    'claude':    { name: 'Claude 3.5 Haiku',    fn: (m, h, s, t) => chatWithClaude(m, h, s, t, attachments)  },
    'mistral':   { name: 'Codestral (Mistral)', fn: (m, h, s, t) => chatWithMistral(m, h, s, t)              },
    'codestral': { name: 'Codestral (Code)',    fn: (m, h, s, t) => codestral.chat(m, h, s, t)               }
  };

  const provider = providers[requestedModel] || providers['groq'];

  try {
    const reply = await provider.fn(message, history, effectiveSystemPrompt, temperature);
    return { reply, model: provider.name, latency: Date.now() - start };
  } catch (err) {
    console.error(`[Router] ${provider.name} failed:`, err.message);
    const error = new Error(`${provider.name} failed: ${err.message}`);
    error.code = 'AI_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
}

/**
 * Streaming router
 */
async function routeChatStream(message, history = [], requestedModel = 'groq', customSystemPrompt = null, temperature = 0.7, attachments = []) {
  // Note: customSystemPrompt already includes the User Bio injected by the chat route.
  const effectiveSystemPrompt = customSystemPrompt || '';

  /* ── Auto-route coding queries to Codestral streaming ── */
  const codestralAvailable = process.env.MISTRAL_API_KEY &&
    process.env.MISTRAL_API_KEY.length > 10;
  const isCodeTask = CODESTRAL_TRIGGERS.some(t =>
    message.toLowerCase().includes(t));

  // Skip Codestral auto-routing if images are present
  if (codestralAvailable && isCodeTask && attachments.length === 0) {
    try {
      return await codestral.stream(message, history, null, temperature);
    } catch (err) {
      console.error('[Codestral STREAM FAILED - falling through]:', err.message);
    }
  }

  if (requestedModel === 'groq') {
    return streamWithGroq(message, history, effectiveSystemPrompt, temperature, attachments);
  }
  if (requestedModel === 'mistral') {
    return streamWithMistral(message, history, effectiveSystemPrompt, temperature);
  }
  if (requestedModel === 'codestral') {
    return codestral.stream(message, history, effectiveSystemPrompt, temperature);
  }
  throw new Error('Streaming only supported for Groq, Mistral, and Codestral in this configuration');
}

module.exports = { routeChat, routeChatStream };
