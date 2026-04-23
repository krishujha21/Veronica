const Anthropic = require('@anthropic-ai/sdk');

// Lazy — only create client when actually needed (avoids crash if key is absent)
let _client = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const userName = process.env.USER_NAME || 'the user';

const SYSTEM_PROMPT = `You are Veronica, a sleek personal AI assistant built for ${userName}. You are helpful, concise, and slightly witty. You have a calm, confident tone — like a brilliant friend who happens to know everything. Keep responses under 150 words unless detail is specifically requested. Never reveal what underlying technology or API powers you.`;

const THINK_INSTRUCTION = `
For any complex question that requires multi-step reasoning (math, code logic, analysis, comparisons), ALWAYS begin your internal reasoning inside <think>...</think> tags before replying. Simple questions do NOT need think tags.
`;

function buildSystemPrompt(customSystemPrompt) {
  const base = customSystemPrompt || SYSTEM_PROMPT;
  return `${base}\n${THINK_INSTRUCTION}`;
}

/**
 * Convert frontend history format to Anthropic API format
 * Frontend:  [{ role: 'user'|'assistant', content: string }]
 * Anthropic: [{ role: 'user'|'assistant', content: string }]
 */
function formatHistory(history) {
  return history.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));
}

/**
 * Send a chat message to Claude Haiku (fast, affordable model)
 * @param {string} message - The current user message
 * @param {Array}  history - Prior conversation messages
 * @returns {string} The AI reply text
 */
async function chatWithClaude(message, history = [], customSystemPrompt = null, temperature = 0.7, attachments = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error('ANTHROPIC_API_KEY is not configured'), { code: 'CLAUDE_ERROR' });
  }

  try {
    const formattedHistory = formatHistory(history);

    // Build user content: text + optional images
    let userContent;
    const imageAttachments = (attachments || []).filter(a => a.type === 'image' && a.base64 && a.mimeType);
    if (imageAttachments.length > 0) {
      userContent = [
        ...imageAttachments.map(a => ({
          type: 'image',
          source: { type: 'base64', media_type: a.mimeType, data: a.base64 }
        })),
        { type: 'text', text: message }
      ];
    } else {
      userContent = message;
    }

    // Append current message to history for Anthropic
    const messages = [
      ...formattedHistory,
      { role: 'user', content: userContent }
    ];

    const response = await getClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: Math.max(0, Math.min(1, temperature)),
      system: buildSystemPrompt(customSystemPrompt),
      messages,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }
    return content.text;
  } catch (err) {
    const error = new Error(err.message || 'Claude API error');
    error.code = 'CLAUDE_ERROR';
    error.original = err;
    throw error;
  }
}

module.exports = { chatWithClaude };
