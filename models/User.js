const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  verified: { type: Boolean, default: false },
  pending: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now },
  lastOtpSent: Date,
  otp: String,
  otpExpires: Date,
  isPrimary: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  emails: [EmailSchema],
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  projectAccessRequests: [{
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    access: { type: String, enum: ['read', 'write', 'both'], default: 'read' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  socialLinks: [{
    type: { type: String, enum: ['project', 'social'], required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }
  }]
});

// Ensure only one primary email
UserSchema.pre('save', function (next) {
  if (this.emails && this.emails.length > 0) {
    const primaryEmails = this.emails.filter(email => email.isPrimary);
    if (primaryEmails.length > 1) {
      // Keep only the first one as primary
      for (let i = 1; i < primaryEmails.length; i++) {
        primaryEmails[i].isPrimary = false;
      }
    }
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
