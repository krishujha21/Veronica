require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const chatRoute = require('./routes/chat');
const systemRoute = require('./routes/system');
const notesRoute = require('./routes/notes');
const tasksRoute = require('./routes/tasks');
const weatherRoute = require('./routes/weather');
const memoryRoute = require('./routes/memory');
const searchRoute = require('./routes/search');
const sandboxRoute = require('./routes/sandbox');
const authRoute = require('./routes/auth');
const authMiddleware = require('./middleware/auth');
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();

// ─── Database ─────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/veronica')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// ─── Security & Parsing ────────────────────────────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '10kb' }));

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(requestLogger);
app.use(rateLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoute);
app.use('/api/chat', authMiddleware, chatRoute);
app.use('/api/system', systemRoute); // Public-ish
app.use('/api/notes', authMiddleware, notesRoute);
app.use('/api/tasks', authMiddleware, tasksRoute);
app.use('/api/weather', weatherRoute); // Public
app.use('/api/memory', authMiddleware, memoryRoute);
app.use('/api/search', authMiddleware, searchRoute);
app.use('/api/sandbox', authMiddleware, sandboxRoute);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const banner = `
╔══════════════════════════════════════════════╗
║    VERONICA BACKEND ONLINE — Port ${PORT}      ║
║    Environment : ${(process.env.NODE_ENV || 'development').padEnd(12)}              ║
║    CORS Origin : ${ALLOWED_ORIGIN.padEnd(28)} ║
╚══════════════════════════════════════════════╝`;
  console.log(banner);
});

module.exports = app;
