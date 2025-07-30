const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    text: { type: String, required: true },
    tag: { type: String, default: 'General' },
    completed: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    dueDate: { type: Date },
    isPublic: {
        type: Boolean,
        default: false
    },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

module.exports = mongoose.model('Task', taskSchema);
