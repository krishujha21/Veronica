const { routeChat, routeChatStream } = require('../services/router');
const router = require('express').Router();
const { fetchContext } = require('./search');
const { getMemoryForUser } = require('./memory');

async function getEnhancedPrompt(message, systemPrompt, useWebSearch, userId) {
  let enhanced = systemPrompt || '';
  
  // Inject User Bio (Memory)
  const memory = await getMemoryForUser(userId);
  if (memory && memory.bio && memory.ragEnabled) {
    const memoryPrefix = `[User Background Info: ${memory.bio}]`;
    enhanced = `${memoryPrefix}\n\n${enhanced}`;
  }

  // Inject Web Search Context
  if (useWebSearch) {
    try {
      const context = await fetchContext(message.trim());
      if (context) {
        const webPrefix = `[Web Search Results for: "${message.trim()}"\n${context}]`;
        enhanced = `${webPrefix}\n\n${enhanced}`;
      }
    } catch (searchErr) {
      console.warn('[Chat/Search] Search failed:', searchErr.message);
    }
  }

  return enhanced;
}

/**
 * POST /api/chat
 * Standard (non-streaming)
 */
router.post('/', async (req, res, next) => {
  try {
    const { message, history = [], model = 'groq', systemPrompt, temperature, attachments = [], useWebSearch = false } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required', code: 'INVALID_INPUT' });
    }

    const enhancedSystemPrompt = await getEnhancedPrompt(message, systemPrompt, useWebSearch, req.user._id);

    const { reply, model: usedModel, latency } = await routeChat(message.trim(), history, model, enhancedSystemPrompt, temperature, attachments);
    res.json({ reply, model: usedModel, latency, timestamp: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'AI_UNAVAILABLE') {
      return res.status(503).json({ error: err.message, code: err.code });
    }
    next(err);
  }
});

/**
 * POST /api/chat/stream
 * Server-Sent Events streaming
 */
router.post('/stream', async (req, res, next) => {
  const { message, history = [], model = 'groq', systemPrompt, temperature, attachments = [], useWebSearch = false } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required', code: 'INVALID_INPUT' });
  }

  const enhancedSystemPrompt = await getEnhancedPrompt(message, systemPrompt, useWebSearch, req.user._id);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); 
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Heartbeat
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);

  try {
    const stream = await routeChatStream(message.trim(), history, model, enhancedSystemPrompt, temperature, attachments);
    let fullReply = '';

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullReply += token;
        send('token', { token });
      }
    }

    send('done', { reply: fullReply, model });
  } catch (err) {
    console.error('[SSE Stream Error]', err.message);
    send('error', { message: err.message || 'Streaming failed' });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

module.exports = router;
