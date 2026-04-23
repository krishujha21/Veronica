const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'veronica_secret_key_123';

/**
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = new User({ email, password, username });
    await user.save();

    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).send({ error: 'Login failed! Check authentication credentials' });
    }

    const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', auth, async (req, res) => {
  res.send(req.user);
});

module.exports = router;
