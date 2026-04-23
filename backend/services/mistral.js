/**
 * Mistral AI (Codestral) — using Node.js native https module
 * No extra dependencies required.
 */
const https = require('https');

const userName = process.env.USER_NAME || 'the user';

const SYSTEM_PROMPT = `You are Veronica, a sleek personal AI assistant built for ${userName}. You are helpful, concise, and slightly witty. You have a calm, confident tone — like a brilliant friend who happens to know everything. Keep responses under 100 words unless detail is specifically requested. Never reveal what underlying technology or API powers you.`;

function buildMessages(message, history, customSystemPrompt) {
  const trimmedHistory = history
    .slice(-10)
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content || '').substring(0, 800)
    }));

  return [
    { role: 'system', content: customSystemPrompt || SYSTEM_PROMPT },
    ...trimmedHistory,
    { role: 'user', content: message }
  ];
}

/**
 * Make a raw HTTPS POST to Mistral's OpenAI-compatible endpoint.
 * @param {object} body - The JSON request body
 * @param {boolean} stream - Whether to return the raw response stream
 */
function mistralRequest(body, stream = false) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);

    const options = {
      hostname: 'codestral.mistral.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      if (stream) {
        return resolve(res); // Return the raw stream
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error || parsed.message) {
            return reject(new Error(parsed.error?.message || parsed.message));
          }
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse Mistral response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('Mistral request timed out'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Standard (non-streaming) Mistral/Codestral chat
 */
async function chatWithMistral(message, history = [], customSystemPrompt = null, temperature = 0.7) {
  if (!process.env.MISTRAL_API_KEY) {
    throw Object.assign(new Error('MISTRAL_API_KEY is not configured'), { code: 'MISTRAL_ERROR' });
  }

  try {
    const response = await mistralRequest({
      model: 'codestral-latest',
      messages: buildMessages(message, history, customSystemPrompt),
      max_tokens: 512,
      temperature: Math.max(0, Math.min(1, temperature)),
      stream: false
    });

    return response.choices[0].message.content;
  } catch (err) {
    const error = new Error(err.message || 'Mistral API error');
    error.code = 'MISTRAL_ERROR';
    throw error;
  }
}

/**
 * Streaming Mistral/Codestral — returns an async generator of Groq-compatible chunks
 */
async function streamWithMistral(message, history = [], customSystemPrompt = null, temperature = 0.7) {
  if (!process.env.MISTRAL_API_KEY) {
    throw Object.assign(new Error('MISTRAL_API_KEY is not configured'), { code: 'MISTRAL_ERROR' });
  }

  const rawStream = await mistralRequest({
    model: 'codestral-latest',
    messages: buildMessages(message, history, customSystemPrompt),
    max_tokens: 512,
    temperature: Math.max(0, Math.min(1, temperature)),
    stream: true
  }, true);

  // Return async generator yielding Groq-compatible chunk objects
  return (async function* () {
    let buffer = '';

    for await (const chunk of rawStream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // save incomplete line for next iteration

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const token = data.choices?.[0]?.delta?.content || '';
            if (token) {
              yield { choices: [{ delta: { content: token } }] };
            }
          } catch (e) { /* skip malformed */ }
        }
      }
    }
  })();
}

module.exports = { chatWithMistral, streamWithMistral };
