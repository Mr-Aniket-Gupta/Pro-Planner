const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const Task = require('../models/task');

router.post('/', createTask);
router.get('/:projectId', getTasks);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

// Task search/filter
router.get('/search', async (req, res) => {
  try {
    const { projectId, q = '', priority = '', status = '', due = '' } = req.query;
    const query = { projectId };
    if (q) {
      query.text = { $regex: q, $options: 'i' };
    }
    if (priority) {
      query.priority = priority;
    }
    if (status) {
      query.completed = status === 'completed';
    }
    // Date filter
    if (due) {
      const today = new Date();
      today.setHours(0,0,0,0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      if (due === 'today') {
        query.dueDate = { $gte: today, $lt: tomorrow };
      } else if (due === 'upcoming') {
        query.dueDate = { $gte: tomorrow };
      } else if (due === 'overdue') {
        query.dueDate = { $lt: today };
      }
    }
    const tasks = await Task.find(query).sort({ created: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search tasks' });
  }
});

module.exports = router;
