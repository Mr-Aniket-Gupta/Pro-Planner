const User = require('../models/User');
const Todo = require('../models/Todo');
const Note = require('../models/Note');

// Get todos and notes for current user
exports.getUserData = async (req, res) => {
    try {
        const userId = req.session.userId;
        const todos = await Todo.find({ userId });
        const note = await Note.findOne({ userId });
        res.json({ todos, notes: note ? note.content : '' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

// Update todos for current user (replace all)
exports.updateTodos = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { todos } = req.body;
        // Remove old todos
        await Todo.deleteMany({ userId });
        // Insert new todos
        const newTodos = await Todo.insertMany(todos.map(t => ({ ...t, userId })));
        res.json({ todos: newTodos });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update todos' });
    }
};

// Update notes for current user
exports.updateNotes = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { notes } = req.body;
        const note = await Note.findOneAndUpdate(
            { userId },
            { content: notes },
            { new: true, upsert: true }
        );
        res.json({ notes: note.content });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notes' });
    }
}; 