const router = require('express').Router();

/**
 * Fetch DuckDuckGo Instant Answer API (no API key required)
 * Returns a simple context string summarizing results
 */
async function fetchDuckDuckGo(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`;

  const res = await fetch(url, { headers: { 'User-Agent': 'Veronica-AI/1.0' } });
  if (!res.ok) throw new Error(`DuckDuckGo returned ${res.status}`);
  const data = await res.json();

  const results = [];

  // Abstract (the main result)
  if (data.AbstractText && data.AbstractText.length > 20) {
    results.push(`[Summary] ${data.AbstractText.substring(0, 600)}`);
  }

  // Related Topics (list items)
  if (Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, 4)) {
      if (topic.Text && topic.Text.length > 10) {
        results.push(`- ${topic.Text.substring(0, 200)}`);
      }
    }
  }

  // Answer (e.g. calcuation results, quick facts)
  if (data.Answer && data.Answer.length > 0) {
    results.push(`[Direct Answer] ${data.Answer}`);
  }

  if (results.length === 0) {
    return null;
  }

  return results.join('\n');
}

/**
 * GET /api/search?q=<query>
 * Returns web search context as a string
 */
router.get('/', async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim() === '') {
    return res.status(400).json({ error: 'Query parameter q is required', code: 'INVALID_INPUT' });
  }

  try {
    const context = await fetchDuckDuckGo(q.trim());
    if (!context) {
      return res.json({ context: null, message: 'No results found' });
    }
    res.json({ context, query: q.trim() });
  } catch (err) {
    console.error('[Search] DuckDuckGo fetch failed:', err.message);
    res.status(502).json({ error: 'Search service unavailable', code: 'SEARCH_FAILED' });
  }
});

module.exports = router;

/**
 * Internal helper — used by chat route to inject search context
 */
module.exports.fetchContext = fetchDuckDuckGo;
