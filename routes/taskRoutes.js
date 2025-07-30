// Task routes
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const Task = require('../models/task');

// Task CRUD
router.post('/', taskController.createTask);
router.get('/:projectId', taskController.getTasks);
router.put('/:taskId', taskController.updateTask);
router.delete('/:taskId', taskController.deleteTask);
router.put('/update-public-status/:projectId', taskController.updateTasksPublicStatus);

// Task search and filter
router.get('/search', async (req, res) => {
  try {
    const { projectId, q = '', priority = '', status = '', due = '' } = req.query;
    const query = { projectId };
    if (q) query.text = { $regex: q, $options: 'i' };
    if (priority) query.priority = priority;
    if (status) query.completed = status === 'completed';
    if (due) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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
