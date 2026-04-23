const isDev = process.env.NODE_ENV === 'development';

/**
 * Global Express error handler — must be last middleware
 * Signature: (err, req, res, next) — 4 params required by Express
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  if (isDev) {
    console.error(`\n[ERROR] ${new Date().toISOString()}`);
    console.error(`Path   : ${req.method} ${req.originalUrl}`);
    console.error(`Code   : ${code}`);
    console.error(`Status : ${status}`);
    console.error('Stack  :', err.stack);
  }

  res.status(status).json({
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...(isDev && { stack: err.stack })
  });
}

module.exports = { errorHandler };
