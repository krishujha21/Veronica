const router = require('express').Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'veronica_secret_key_123';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    const user = new User({ email, password, username });
    await user.save();

    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('[Auth/Register]', err.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Google-only account — no password set
    if (!user.password) {
      return res.status(401).json({
        error: 'This account uses Google Sign-In. Please continue with Google.',
        code: 'GOOGLE_ACCOUNT'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (err) {
    console.error('[Auth/Login]', err.message);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ─── Google OAuth Routes ────────────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Kicks off the Google OAuth flow
 */
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here after user consents.
 * Issues a JWT and redirects the frontend with ?token=...
 */
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/auth?error=google_failed` }),
  (req, res) => {
    try {
      const token = jwt.sign({ _id: req.user._id.toString() }, JWT_SECRET, { expiresIn: '30d' });
      // Redirect to frontend /auth/callback with token in query param
      res.redirect(`${CLIENT_URL}/auth/callback?token=${token}`);
    } catch (err) {
      console.error('[Auth/Google/Callback]', err.message);
      res.redirect(`${CLIENT_URL}/auth?error=token_failed`);
    }
  }
);

module.exports = router;
