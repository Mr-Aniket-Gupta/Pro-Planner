const express = require('express');
const router = express.Router();
const {
    createTask,
    getTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

router.post('/', createTask);
router.get('/:projectId', getTasks);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

module.exports = router;
