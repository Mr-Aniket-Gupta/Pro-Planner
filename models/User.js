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
  lastLogin: Date
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
