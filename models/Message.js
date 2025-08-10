const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, index: true },
    clientId: { type: String },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    ts: { type: Date, default: Date.now, index: true },
    delivered: { type: Boolean, default: false, index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date }
  },
  { timestamps: true }
);

// Prevent duplicate optimistic inserts from the same sender
MessageSchema.index({ from: 1, clientId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Message', MessageSchema);


