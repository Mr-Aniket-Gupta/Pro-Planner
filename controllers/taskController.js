const Task = require('../models/task');

exports.createTask = async (req, res) => {
    try {
        const { text, tag, projectId, dueDate, priority } = req.body;
        const task = new Task({
            text,
            tag,
            projectId,
            dueDate,
            priority
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.projectId });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { completed, text, tag, dueDate, priority } = req.body;
        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            { completed, text, tag, dueDate, priority },
            { new: true }
        );
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        await Task.findByIdAndDelete(req.params.taskId);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
