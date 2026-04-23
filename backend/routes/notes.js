const router = require('express').Router();
const Note = require('../models/Note');

const VALID_COLORS = ['yellow', 'blue', 'green', 'white'];

/**
 * GET /api/notes/search?q=<query>
 */
router.get('/search', async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q.trim()) return res.json({ notes: [], count: 0 });

    const matched = await Note.find({
      userId: req.user._id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ]
    });

    res.json({ notes: matched, count: matched.length, query: q });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/notes
 */
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ notes, count: notes.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

/**
 * POST /api/notes
 */
router.post('/', async (req, res) => {
  try {
    const { title = '', content, color = 'yellow' } = req.body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({ error: 'Content is required' });
    }

    const note = new Note({
      title: title.trim(),
      content: content.trim(),
      color: VALID_COLORS.includes(color) ? color : 'yellow',
      userId: req.user._id
    });

    await note.save();
    res.status(201).json({ note, message: 'Note created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create note' });
  }
});

/**
 * DELETE /api/notes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
