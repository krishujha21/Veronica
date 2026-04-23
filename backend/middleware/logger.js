// ANSI color codes
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';

function colorStatus(status) {
  if (status >= 500) return `${RED}${status}${RESET}`;
  if (status >= 400) return `${RED}${status}${RESET}`;
  if (status >= 300) return `${YELLOW}${status}${RESET}`;
  return `${GREEN}${status}${RESET}`;
}

function requestLogger(req, res, next) {
  // FIX 4: Skip logging on high-frequency endpoints (system is polled every 3s)
  if (req.originalUrl.startsWith('/api/system') || req.originalUrl === '/health') {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - start;
    const timestamp = new Date().toISOString();
    const method = `${CYAN}${req.method.padEnd(6)}${RESET}`;
    const path = req.originalUrl;
    const status = colorStatus(res.statusCode);
    const ms = `${DIM}${latency}ms${RESET}`;

    console.log(`${DIM}[${timestamp}]${RESET} ${method} ${path} → ${status} ${ms}`);
  });

  next();
}

module.exports = { requestLogger };
