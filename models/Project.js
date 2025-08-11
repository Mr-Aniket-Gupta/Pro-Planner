const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: String,
  basic: [String],
  advanced: [String],
  created: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // if user system exists
  completed: { type: Boolean, default: false },
  deadline: { type: Date },
  notes: { type: String, default: '' },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    access: { type: String, enum: ['read', 'write', 'both'], default: 'read' }
  }]
});

// Add indexes for better query performance
projectSchema.index({ userId: 1, created: -1 });
projectSchema.index({ 'sharedWith.user': 1 });
projectSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Project', projectSchema);
