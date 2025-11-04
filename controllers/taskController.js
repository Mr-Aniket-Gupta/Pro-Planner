const Task = require('../models/task');
const Project = require('../models/Project');

// Create a new task
exports.createTask = async (req, res) => {
    try {
        const { text, tag, projectId, dueDate, priority, isPublic } = req.body;
        
        // Input validation
        if (!text || !projectId) {
            return res.status(400).json({ error: 'Task text and project ID are required' });
        }
        
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const userId = req.session.userId;
        const isOwner = project.userId.toString() === userId.toString();
        let sharedAccess = null;
        if (!isOwner && project.sharedWith && project.sharedWith.length > 0) {
            const shared = project.sharedWith.find(sw => sw.user.toString() === userId.toString());
            if (shared) sharedAccess = shared.access;
        }
        if (!isOwner && (sharedAccess !== 'write' && sharedAccess !== 'both')) {
            return res.status(403).json({ error: 'No permission to add tasks to this project' });
        }
        const task = new Task({
            text,
            tag,
            projectId,
            dueDate,
            priority,
            isPublic: isPublic || false
        });
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create task' });
    }
};

// Get all tasks for a project
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ projectId: req.params.projectId });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Update a task (owner or shared user with write/both access)
exports.updateTask = async (req, res) => {
    try {
        const { completed, text, tag, dueDate, priority, isPublic } = req.body;
        
        // Input validation
        if (text !== undefined && (!text || text.trim().length === 0)) {
            return res.status(400).json({ error: 'Task text cannot be empty' });
        }
        
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const userId = req.session.userId;
        const isOwner = project.userId.toString() === userId.toString();
        let sharedAccess = null;
        if (!isOwner && project.sharedWith && project.sharedWith.length > 0) {
            const shared = project.sharedWith.find(sw => sw.user.toString() === userId.toString());
            if (shared) sharedAccess = shared.access;
        }
        if (!isOwner && (sharedAccess !== 'write' && sharedAccess !== 'both')) {
            return res.status(403).json({ error: 'No permission to update this task' });
        }
        if (completed !== undefined) {
            task.completed = completed;
            task.completedAt = completed ? new Date() : null;
        }
        if (text !== undefined) task.text = text;
        if (tag !== undefined) task.tag = tag;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (priority !== undefined) task.priority = priority;
        if (isPublic !== undefined) task.isPublic = isPublic;
        await task.save();
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Delete a task (owner or shared user with write/both access)
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        const project = await Project.findById(task.projectId);
        if (!project) return res.status(404).json({ error: 'Project not found' });
        const userId = req.session.userId;
        const isOwner = project.userId.toString() === userId.toString();
        let sharedAccess = null;
        if (!isOwner && project.sharedWith && project.sharedWith.length > 0) {
            const shared = project.sharedWith.find(sw => sw.user.toString() === userId.toString());
            if (shared) sharedAccess = shared.access;
        }
        if (!isOwner && (sharedAccess !== 'write' && sharedAccess !== 'both')) {
            return res.status(403).json({ error: 'No permission to delete this task' });
        }
        await Task.findByIdAndDelete(req.params.taskId);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

// Update public/private status for all tasks in a project
exports.updateTasksPublicStatus = async (req, res) => {
    try {
        const { isPublic } = req.body;
        const { projectId } = req.params;
        await Task.updateMany({ projectId }, { isPublic });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update tasks public/private status' });
    }
};
