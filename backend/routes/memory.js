const router = require('express').Router();
const Memory = require('../models/Memory');

/**
 * Helper to get or create memory for a user
 */
async function getOrCreateMemory(userId) {
  let memory = await Memory.findOne({ userId });
  if (!memory) {
    memory = new Memory({ userId, bio: '', ragEnabled: true });
    await memory.save();
  }
  return memory;
}

/**
 * GET /api/memory
 */
router.get('/', async (req, res) => {
  try {
    const memory = await getOrCreateMemory(req.user._id);
    res.json({ bio: memory.bio, ragEnabled: memory.ragEnabled });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

/**
 * POST /api/memory
 */
router.post('/', async (req, res) => {
  try {
    const { bio, ragEnabled } = req.body;
    const memory = await getOrCreateMemory(req.user._id);

    if (typeof bio === 'string') {
      memory.bio = bio.trim();
    }
    if (typeof ragEnabled === 'boolean') {
      memory.ragEnabled = ragEnabled;
    }

    await memory.save();
    res.json({ message: 'Memory updated', memory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

/**
 * DELETE /api/memory
 */
router.delete('/', async (req, res) => {
  try {
    const memory = await getOrCreateMemory(req.user._id);
    memory.bio = '';
    await memory.save();
    res.json({ message: 'Memory cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear memory' });
  }
});

module.exports = router;

// Export a function to get memory for use in chat route
module.exports.getMemoryForUser = async (userId) => {
  return await getOrCreateMemory(userId);
};
