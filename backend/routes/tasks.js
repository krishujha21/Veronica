const router = require('express').Router();
const Task = require('../models/Task');

const VALID_PRIORITIES = ['high', 'medium', 'low'];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

/**
 * GET /api/tasks
 * Returns all tasks for the logged-in user
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id });
    
    const sorted = tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    });

    res.json({ tasks: sorted, count: sorted.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * POST /api/tasks
 */
router.post('/', async (req, res) => {
  try {
    const { text, priority = 'medium' } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({ error: 'Task text is required' });
    }

    const task = new Task({
      text: text.trim(),
      priority: VALID_PRIORITIES.includes(priority) ? priority : 'medium',
      userId: req.user._id
    });

    await task.save();
    res.status(201).json({ task, message: 'Task created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * PATCH /api/tasks/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { completed, text, priority } = req.body;
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (typeof completed === 'boolean') task.completed = completed;
    if (text && typeof text === 'string' && text.trim()) task.text = text.trim();
    if (priority && VALID_PRIORITIES.includes(priority)) task.priority = priority;

    await task.save();
    res.json({ task, message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
