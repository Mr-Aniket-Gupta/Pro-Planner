// User data routes
const express = require('express');
const router = express.Router();
const userDataController = require('../controllers/userDataController');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aniketgupta721910@gmail.com',
        pass: 'ngwf udjw pgui rvbt'
    }
});

// Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-gemini-api-key');

// Get all user data (todos + notes)
router.get('/', userDataController.getUserData);
// Update todos
router.put('/todos', userDataController.updateTodos);
// Update notes
router.put('/notes', userDataController.updateNotes);

// Chat System Endpoints
// Get current user for chat
router.get('/current-user', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(req.session.userId).select('_id name emails');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const primaryEmail = user.emails?.find(e => e.isPrimary)?.email;
        const firstEmail = user.emails?.[0]?.email;
        const email = primaryEmail || firstEmail || '';

        res.json({
            success: true,
            _id: user._id,
            name: user.name || 'User',
            email: email
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ success: false, message: 'Failed to get user data' });
    }
});

// Get friends list for chat
router.get('/friends', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findById(req.session.userId).populate('connections', '_id name emails');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get connected friends with chat data
        const friends = (user.connections || []).map(friend => ({
            _id: friend._id,
            name: friend.name || 'User',
            email: friend.emails?.find(e => e.isPrimary)?.email || friend.emails?.[0]?.email || '',
            online: Math.random() > 0.3, // Random online status for demo
            lastMsg: 'Start a conversation!',
            lastTime: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            avatar: generateAvatar(friend.name || 'User'),
            messages: []
        }));

        res.json(friends);
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ success: false, message: 'Failed to get friends data' });
    }
});

// Helper function to generate avatar
function generateAvatar(name) {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const color = colors[name.length % colors.length];
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${color}"/><text x="20" y="25" font-family="Arial" font-size="16" fill="white" text-anchor="middle">${initials}</text></svg>`;
}

// Gemini AI Chat API
router.post('/ai/chat', async (req, res) => {
    try {
        const { message, projectContext, language } = req.body;
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        const lang = (language === 'hi' || language === 'en') ? language : 'en';
        let contextPrompt = `You are ProPlanner AI Assistant, a helpful project management assistant.\n\nUser: ${user.name}\nCurrent Message: ${message}\n\nPlease answer ONLY in ${lang === 'hi' ? 'Hindi' : 'English'} with proper markdown formatting, concise and actionable. You can help with:\n- Project planning and task management advice\n- Productivity tips\n- Time management suggestions\n- Project organization recommendations\n- General questions about ProPlanner features`;
        if (projectContext) {
            contextPrompt += `\n\nProject Context: ${projectContext}`;
        }
        const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyBKZCqmoC9WBlEFBXbeOyeMg7vf-DEtvHo";
        const requestBody = {
            contents: [{
                parts: [{ text: contextPrompt }]
            }]
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        res.json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Gemini AI Error:', error);
        res.status(500).json({
            success: false,
            message: 'AI service temporarily unavailable. Please try again later.',
            error: error.message
        });
    }
});

// Voice to Text API (placeholder)
router.post('/ai/voice-to-text', async (req, res) => {
    try {
        const { audioData } = req.body;
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        res.json({
            success: true,
            message: 'Voice processing feature coming soon!',
            text: 'Voice input detected. Please use text input for now.'
        });
    } catch (error) {
        console.error('Voice Processing Error:', error);
        res.status(500).json({
            success: false,
            message: 'Voice processing service unavailable.',
            error: error.message
        });
    }
});


// Connection system
router.post('/search-users', userDataController.searchUsers);
router.post('/send-connection-request', userDataController.sendConnectionRequest);
router.post('/accept-connection-request', userDataController.acceptConnectionRequest);
router.get('/pending-requests', userDataController.getPendingRequests);
router.get('/connections', userDataController.getConnections);
router.post('/remove-connection', require('../controllers/userDataController').removeConnection);

// Notification count APIs
router.get('/notification-counts', userDataController.getNotificationCounts);

// Social links
router.get('/social-links', userDataController.getSocialLinks);
router.put('/social-links', userDataController.updateSocialLinks);

// Helper: validate email
function validateEmail(email) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

// Send OTP to email (add or resend)
router.post('/email/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!validateEmail(email)) return res.json({ success: false, message: 'Invalid email format' });
    const existingUser = await User.findOne({ 'emails.email': email });
    if (existingUser && existingUser._id.toString() !== req.session.userId) {
        return res.json({ success: false, message: 'Email already in use by another user' });
    }
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    let emailObj = user.emails.find(e => e.email === email);
    if (emailObj && emailObj.verified) {
        return res.json({ success: false, message: 'Email already verified' });
    }
    if (!emailObj) {
        emailObj = {
            email,
            verified: false,
            pending: true,
            addedAt: new Date(),
            isPrimary: user.emails.length === 0
        };
        user.emails.push(emailObj);
    }
    const now = new Date();
    if (emailObj.lastOtpSent && now - emailObj.lastOtpSent < 60000) {
        return res.json({ success: false, message: 'OTP already sent recently. Please wait.' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    emailObj.otp = otp;
    emailObj.otpExpires = new Date(now.getTime() + 10 * 60 * 1000);
    emailObj.lastOtpSent = now;
    emailObj.pending = true;
    await user.save();
    try {
        await transporter.sendMail({
            from: 'aniketgupta721910@gmail.com',
            to: email,
            subject: 'ProPlanner - Email Verification OTP',
            text: `Your OTP for email verification is: ${otp}\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.`
        });
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Email sending error:', error);
        res.json({ success: false, message: 'Failed to send OTP. Please try again.' });
    }
});

// Verify OTP
router.post('/email/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const emailObj = user.emails.find(e => e.email === email && e.pending);
    if (!emailObj) return res.json({ success: false, message: 'Email not found or already verified' });
    if (!emailObj.otp || !emailObj.otpExpires || emailObj.otp !== otp || new Date() > emailObj.otpExpires) {
        return res.json({ success: false, message: 'Invalid or expired OTP' });
    }
    emailObj.verified = true;
    emailObj.pending = false;
    emailObj.otp = undefined;
    emailObj.otpExpires = undefined;
    if (user.emails.filter(e => e.verified).length === 0) {
        emailObj.isPrimary = true;
    }
    await user.save();
    res.json({ success: true, message: 'Email verified successfully' });
});

// Remove email
router.post('/email/remove', async (req, res) => {
    const { email } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const emailObj = user.emails.find(e => e.email === email);
    if (!emailObj) return res.json({ success: false, message: 'Email not found' });
    const verifiedEmails = user.emails.filter(e => e.verified && e.email !== email);
    if (emailObj.verified && verifiedEmails.length === 0) {
        return res.json({ success: false, message: 'At least one verified email required' });
    }
    user.emails = user.emails.filter(e => e.email !== email);
    if (emailObj.isPrimary && verifiedEmails.length > 0) {
        const newPrimary = user.emails.find(e => e.verified);
        if (newPrimary) {
            newPrimary.isPrimary = true;
        }
    }
    await user.save();
    res.json({ success: true, message: 'Email removed successfully' });
});

// Set primary email
router.post('/email/primary', async (req, res) => {
    const { email } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const found = user.emails.find(e => e.email === email && e.verified);
    if (!found) return res.json({ success: false, message: 'Email must be verified' });
    user.emails.forEach(e => e.isPrimary = false);
    found.isPrimary = true;
    await user.save();
    res.json({ success: true, message: 'Primary email updated successfully' });
});

// Get user profile
router.get('/profile', async (req, res) => {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    res.json({
        name: user.name,
        emails: user.emails || []
    });
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const { name } = req.body;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (name) {
            user.name = name;
        }
        await user.save();
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

module.exports = router; 