const https = require('https');
const { URL } = require('url');
const { streamWithGroq } = require('./groq'); // keep for backward compatibility with specific groq edge cases if any
const codestral = require('./codestral');

// Centralized Flexible Model Registry
const MODEL_CONFIG = {};

const userName = process.env.USER_NAME || 'the user';
const SYSTEM_PROMPT = `You are Veronica, a sleek personal AI assistant built for ${userName}. You are helpful, concise, and slightly witty. You have a calm, confident tone — like a brilliant friend who happens to know everything. Keep responses under 100 words unless detail is specifically requested. Never reveal what underlying technology or API powers you.`;

function buildMessages(message, history, customSystemPrompt, attachments, supportsVision) {
  const trimmedHistory = history
    .slice(-10)
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content || '').substring(0, 800)
    }));

  const imageAttachments = attachments.filter(a => a.type === 'image' && a.base64 && a.mimeType);

  let userContent;
  if (imageAttachments.length > 0 && supportsVision) {
    userContent = [
      { type: 'text', text: message },
      ...imageAttachments.map(a => ({
        type: 'image_url',
        image_url: { url: `data:${a.mimeType};base64,${a.base64}` }
      }))
    ];
  } else {
    userContent = message;
    if (imageAttachments.length > 0) {
      console.warn('Images attached but model does not support vision. Sending text only.');
    }
  }

  return [
    { role: 'system', content: customSystemPrompt || SYSTEM_PROMPT },
    ...trimmedHistory,
    { role: 'user', content: userContent }
  ];
}

function genericApiRequest(config, messages, temperature, stream) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env[config.apiKeyEnv];
    if (!apiKey) {
      return reject(Object.assign(new Error(`${config.apiKeyEnv} is not configured`), { code: 'CONFIG_ERROR' }));
    }

    const hasVision = messages.some(m => Array.isArray(m.content) && m.content.some(part => part.type === 'image_url'));
    const targetModelId = hasVision ? (config.visionModelId || config.modelId) : config.modelId;

    const payload = JSON.stringify({
      model: targetModelId,
      messages,
      temperature: Math.max(0, Math.min(1, temperature)),
      max_tokens: 512,
      stream
    });

    const urlObj = new URL(config.endpoint);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      if (stream) return resolve(res);

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.choices[0].message.content);
        } catch (e) {
          reject(new Error(`Failed to parse API response from ${config.name}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error(`${config.name} request timed out`)));
    req.write(payload);
    req.end();
  });
}

async function routeChat(message, history = [], requestedModel = 'groq', customSystemPrompt = null, temperature = 0.7, attachments = []) {
  const start = Date.now();
  const config = MODEL_CONFIG[requestedModel] || Object.values(MODEL_CONFIG)[0];
  
  if (!config) {
    const error = new Error('No AI agents are currently configured in the system.');
    error.code = 'AI_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
  
  const messages = buildMessages(message, history, customSystemPrompt, attachments, config.supportsVision);

  try {
    const reply = await genericApiRequest(config, messages, temperature, false);
    return { reply, model: config.name, latency: Date.now() - start };
  } catch (err) {
    console.error(`[Router] ${config.name} failed:`, err.message);
    const error = new Error(`${config.name} failed: ${err.message}`);
    error.code = 'AI_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
}

async function routeChatStream(message, history = [], requestedModel = 'groq', customSystemPrompt = null, temperature = 0.7, attachments = []) {
  const config = MODEL_CONFIG[requestedModel] || Object.values(MODEL_CONFIG)[0];

  if (!config) {
    throw new Error('No AI agents are currently configured in the system.');
  }

  const messages = buildMessages(message, history, customSystemPrompt, attachments, config.supportsVision);

  const rawStream = await genericApiRequest(config, messages, temperature, true);

  return (async function* () {
    let buffer = '';
    for await (const chunk of rawStream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); 

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const token = data.choices?.[0]?.delta?.content || '';
            if (token) yield { choices: [{ delta: { content: token } }] };
          } catch (e) {}
        }
      }
    }
  })();
}

module.exports = { routeChat, routeChatStream, MODEL_CONFIG };
