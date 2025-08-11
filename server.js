const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const http = require('http');
const { Server } = require('socket.io');
const MongoStore = require('connect-mongo');

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/task');
const Message = require('./models/Message');

const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userDataRoutes = require('./routes/userDataRoutes');
const messagesRoutes = require('./routes/messages');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// In-memory map of userId -> Set of sockets for real-time chat
const userIdToSockets = new Map();

// Initialize socket connection
io.on('connection', (socket) => {
    // console.log('A user connected:', socket.id);

    // Client should immediately register with their userId
    socket.on('register', async (userId) => {
        try {
            if (!userId) {
                console.warn('No userId provided for registration');
                return;
            }
        socket.userId = userId;
        const set = userIdToSockets.get(userId) || new Set();
        set.add(socket);
        userIdToSockets.set(userId, set);
        socket.emit('registered', { ok: true });

        // Send unread messages in bulk and unread counts when a user connects
        try {
            const unread = await Message.find({ to: new mongoose.Types.ObjectId(userId), read: false }).sort({ ts: 1 }).limit(500);
            if (unread.length) socket.emit('chat:bulk', unread);
            const counts = await Message.aggregate([
                { $match: { to: new mongoose.Types.ObjectId(userId), read: false } },
                { $group: { _id: '$from', count: { $sum: 1 } } }
            ]);
            socket.emit('chat:unreadCounts', counts);
        } catch (e) {
            console.error('register unread sync error', e);
        }
        } catch (error) {
            console.error('Error during socket registration:', error);
        }
    });

    // Handle outgoing chat messages: { to, text, clientId }
    socket.on('chat:send', async (payload) => {
        try {
            if (!payload || !payload.to || typeof payload.text !== 'string' || payload.text.trim().length === 0) {
                console.warn('Invalid chat:send payload:', payload);
                return;
            }
            const from = socket.userId;
            if (!from) {
                console.warn('No userId for socket:', socket.id);
                return;
            }
            const to = payload.to;
            const message = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                from,
                to,
                text: payload.text.trim(),
                ts: Date.now(),
                clientId: payload.clientId // pass through for dedupe
            };
            // Echo back to sender for confirmation (client will dedupe using clientId)
            socket.emit('chat:message', message);
            // Deliver to recipient if online
            const recipientSockets = userIdToSockets.get(to);
            const isOnline = !!recipientSockets && recipientSockets.size > 0;
            if (isOnline) recipientSockets.forEach(s => s.emit('chat:message', message));

            // Persist message
            try {
                await Message.create({
                    messageId: message.id,
                    clientId: payload.clientId,
                    from: new mongoose.Types.ObjectId(from),
                    to: new mongoose.Types.ObjectId(to),
                    text: payload.text.trim(),
                    ts: new Date(message.ts),
                    delivered: isOnline,
                    read: false
                });
            } catch (dbErr) {
                // ignore duplicate clientId errors
                if (dbErr?.code !== 11000) console.error('save message error', dbErr);
            }

            // Send email if recipient offline
            if (!isOnline) {
                try {
                    const toUser = await User.findById(to);
                    const email = toUser?.emails?.find(e => e.verified && e.isPrimary)?.email || toUser?.emails?.[0]?.email;
                    if (email) {
                        await transporter.sendMail({
                            from: process.env.SMTP_USER || 'aniketgupta721910@gmail.com',
                            to: email,
                            subject: 'New message on ProPlanner',
                            text: `You have a new message from ${from}:\n\n${payload.text}\n\nOpen ProPlanner to reply.`
                        });
                    }
                } catch (mailErr) {
                    console.error('offline mail error', mailErr);
                }
            }
        } catch (e) {
            console.error('chat:send error', e);
        }
    });

    // Mark messages as read in a conversation
    socket.on('chat:read', async ({ withUserId }) => {
        try {
            if (!socket.userId || !withUserId) {
                console.warn('Invalid chat:read request:', { userId: socket.userId, withUserId });
                return;
            }
            await Message.updateMany(
                {
                    from: new mongoose.Types.ObjectId(withUserId),
                    to: new mongoose.Types.ObjectId(socket.userId),
                    read: false
                },
                { $set: { read: true, readAt: new Date() } }
            );
        } catch (e) {
            console.error('chat:read error', e);
        }
    });

    // Delete a message
    socket.on('chat:deleteMessage', async ({ messageId }) => {
        try {
            if (!socket.userId || !messageId) {
                console.warn('Invalid chat:deleteMessage request:', { userId: socket.userId, messageId });
                return;
            }

            // Find the message and verify ownership
            const message = await Message.findOne({
                $or: [
                    { messageId: messageId },
                    { clientId: messageId },
                    { _id: mongoose.Types.ObjectId.isValid(messageId) ? new mongoose.Types.ObjectId(messageId) : null }
                ]
            });

            if (!message) {
                socket.emit('chat:deleteError', { message: 'Message not found' });
                return;
            }

            // Check if user is the sender of the message
            if (message.from.toString() !== socket.userId) {
                socket.emit('chat:deleteError', { message: 'You can only delete your own messages' });
                return;
            }

            // Delete the message from database
            await Message.findByIdAndDelete(message._id);

            // Notify all connected users about the message deletion
            io.emit('chat:messageDeleted', {
                messageId: messageId,
                fromUserId: message.from.toString(),
                toUserId: message.to.toString()
            });

            socket.emit('chat:deleteSuccess', { messageId: messageId });

        } catch (e) {
            console.error('chat:deleteMessage error', e);
            socket.emit('chat:deleteError', { message: 'Failed to delete message' });
        }
    });

    socket.on('disconnect', () => {
        const { userId } = socket;
        if (userId && userIdToSockets.has(userId)) {
            const set = userIdToSockets.get(userId);
            set.delete(socket);
            if (set.size === 0) userIdToSockets.delete(userId);
        }
        // console.log('A user disconnected:', socket.id);
    });
});

// Export socket instance for use in other files
module.exports.io = io;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error(err));

// Security middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
    })
}));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Temporary in-memory OTP store
const otpStore = {}; // Structure: { email: { otp, expiresAt, data } }

// Basic rate limiting for OTP requests
const otpRateLimit = new Map(); // Structure: { email: { count, resetTime } }
const MAX_OTP_REQUESTS = 5; // Maximum 5 OTP requests per hour
const OTP_RESET_TIME = 60 * 60 * 1000; // 1 hour in milliseconds

function checkOtpRateLimit(email) {
    const now = Date.now();
    const userLimit = otpRateLimit.get(email);
    
    if (!userLimit || now > userLimit.resetTime) {
        otpRateLimit.set(email, { count: 1, resetTime: now + OTP_RESET_TIME });
        return true;
    }
    
    if (userLimit.count >= MAX_OTP_REQUESTS) {
        return false;
    }
    
    userLimit.count++;
    return true;
}

// Generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Landing page
app.get('/', async (req, res) => {
    let isLoggedIn = false;
    if (req.session && req.session.userId) {
        isLoggedIn = true;
    } else if (req.cookies && req.cookies.proplanner_token) {
        try {
            const decoded = jwt.verify(req.cookies.proplanner_token, process.env.JWT_SECRET || 'supersecretjwtkey');
            if (decoded?.userId) isLoggedIn = true;
        } catch (e) { }
    }
    res.render('landing', { isLoggedIn });
});

// Auth page (login/signup)
app.get('/auth', (req, res) => res.render('auth'));

// Signup - Step 1: Send OTP or direct sign up for Super Admin
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;
        
        // Input validation
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).send('All fields are required');
        }
        
        if (password.length < 6) {
            return res.status(400).send('Password must be at least 6 characters long');
        }
        
        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send('Please enter a valid email address');
        }

        const existingUser = await User.findOne({ 'emails.email': email });
        if (existingUser) return res.status(400).send('Email already exists');

    if (email === 'admin@gmail.com') {
        try {
            const hashed = await bcrypt.hash(password, 10);
            const newUser = new User({
                name,
                password: hashed,
                emails: [{ email, verified: true, isPrimary: true, addedAt: new Date() }]
            });
            await newUser.save();
            req.session.userId = newUser._id;
            return res.send('Signup successful!');
        } catch (userError) {
            console.error('Error creating admin user:', userError);
            return res.status(500).send('Failed to create user. Please try again.');
        }
    }

    // Check rate limit
    if (!checkOtpRateLimit(email)) {
        return res.status(429).send('Too many OTP requests. Please try again later.');
    }
    
    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, data: { name, email, password } };
    
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER || 'aniketgupta721910@gmail.com',
            to: email,
            subject: 'ProPlanner Signup OTP',
            text: `Your OTP for ProPlanner signup is: ${otp}\nThis OTP is valid for 5 minutes.`
        });
        res.send('OTP sent to your email. Please verify.');
    } catch (emailError) {
        console.error('Failed to send signup OTP:', emailError);
        res.status(500).send('Failed to send OTP. Please try again.');
    }
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).send('Failed to process signup. Please try again.');
    }
});

// Signup - Step 2: Verify OTP
app.post('/verify-signup-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).send('Email and OTP are required');
        }
        
        const record = otpStore[email];
        if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
            return res.status(400).send('Invalid or expired OTP');
        }

        const hashed = await bcrypt.hash(record.data.password, 10);
        const newUser = new User({
            name: record.data.name,
            password: hashed,
            emails: [{ email, verified: true, isPrimary: true, addedAt: new Date() }]
        });
        await newUser.save();
        delete otpStore[email];
        req.session.userId = newUser._id;
        res.send('Signup successful!');
    } catch (error) {
        console.error('Error during OTP verification:', error);
        res.status(500).send('Failed to verify OTP. Please try again.');
    }
});

// Login - Step 1: Send OTP or direct login for Super Admin
app.post('/login', async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await User.findOne({ 'emails.email': email, 'emails.verified': true });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (email === 'admin@gmail.com') {
            req.session.userId = user._id;
            req.session.cookie.maxAge = remember ? 14 * 24 * 60 * 60 * 1000 : null;

            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'supersecretjwtkey', {
                expiresIn: remember ? '14d' : '1d'
            });
            return res.json({ message: 'Login successful!', token });
        }

        // Check rate limit
        if (!checkOtpRateLimit(email)) {
            return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
        }
        
        const otp = generateOTP();
        otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, data: { userId: user._id, remember } };
        
        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER || 'aniketgupta721910@gmail.com',
                to: email,
                subject: 'ProPlanner Login OTP',
                text: `Your OTP for ProPlanner login is: ${otp}\nThis OTP is valid for 5 minutes.`
            });
            res.json({ message: 'OTP sent to your email. Please verify.' });
        } catch (emailError) {
            console.error('Failed to send login OTP:', emailError);
            res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Failed to process login. Please try again.' });
    }
});

// Login - Step 2: Verify OTP
app.post('/verify-login-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }
        
        const record = otpStore[email];
        if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        req.session.userId = record.data.userId;
        req.session.cookie.maxAge = record.data.remember ? 14 * 24 * 60 * 60 * 1000 : null;

        const token = jwt.sign({ userId: record.data.userId }, process.env.JWT_SECRET || 'supersecretjwtkey', {
            expiresIn: record.data.remember ? '14d' : '1d'
        });
        delete otpStore[email];
        res.json({ message: 'Login successful!', token });
    } catch (error) {
        console.error('Error during login OTP verification:', error);
        res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
    }
});

// Auto-login using JWT token
app.post('/auto-login', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        req.session.userId = user._id;
        return res.json({ message: 'Auto-login successful!' });
    } catch (error) {
        console.error('Auto-login error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// Dashboard page (session required)
app.get('/dashboard', async (req, res) => {
    try {
        if (!req.session.userId) return res.redirect('/auth');
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy();
            return res.redirect('/auth');
        }
        res.render('dashboard', { user });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('error', { message: 'Failed to load dashboard' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth'));
});

// Contact page
app.get('/contact', (req, res) => {
    res.render('contact');
});

// Error page
app.get('/error', (req, res) => {
    res.render('error', { message: req.query.message || 'An error occurred' });
});

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/userdata', userDataRoutes);
app.use('/api/messages', messagesRoutes);

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER || 'aniketgupta721910@gmail.com',
        pass: process.env.SMTP_PASS || 'ngwf udjw pgui rvbt'
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('Email transporter verification failed:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Daily cron job to email task reminders at 5:09 PM
cron.schedule('09 17 * * *', async () => {
    try {
        console.log('Starting daily task reminder cron job...');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const users = await User.find({});
        console.log(`Found ${users.length} users for task reminders`);
        
        for (const user of users) {
            const projects = await Project.find({ userId: user._id, completed: false });
            let emailContent = `Hello ${user.name || ''},\n\nHere are your projects and tasks with deadlines today:\n`;
            let hasTasks = false;

            for (const project of projects) {
                const tasks = await Task.find({
                    projectId: project._id,
                    dueDate: { $gte: today, $lt: tomorrow },
                    completed: false
                });
                if (tasks.length > 0) {
                    hasTasks = true;
                    emailContent += `\nProject: ${project.name} (Due: ${project.deadline?.toLocaleDateString() || 'No deadline'})\n`;
                    tasks.forEach(task => {
                        emailContent += `  - ${task.text} (Due: ${task.dueDate?.toLocaleDateString() || 'No due date'})\n`;
                    });
                }
            }

            let hasUpcoming = false;
            let upcomingContent = '\nUpcoming Deadlines (Next 7 days):\n';
            for (const project of projects) {
                const tasks = await Task.find({
                    projectId: project._id,
                    dueDate: { $gte: tomorrow, $lt: nextWeek },
                    completed: false
                });
                if (tasks.length > 0) {
                    hasUpcoming = true;
                    upcomingContent += `\nProject: ${project.name} (Due: ${project.deadline?.toLocaleDateString() || 'No deadline'})\n`;
                    tasks.forEach(task => {
                        upcomingContent += `  - ${task.text} (Due: ${task.dueDate?.toLocaleDateString() || 'No due date'})\n`;
                    });
                }
            }

            if (hasTasks || hasUpcoming) {
                emailContent += upcomingContent + '\n- ProPlanner Team';
                const verifiedEmails = user.emails.filter(e => e.verified).map(e => e.email);
                for (const email of verifiedEmails) {
                    try {
                        await transporter.sendMail({
                            from: process.env.SMTP_USER || 'aniketgupta721910@gmail.com',
                            to: email,
                            subject: "Today's & Upcoming Task/Project Deadline Reminder",
                            text: emailContent
                        });
                        console.log(`Reminder sent to ${email}`);
                    } catch (err) {
                        console.error(`Failed to send reminder to ${email}:`, err);
                    }
                }
            }
        }
        console.log('Daily task reminder cron job completed successfully!');
    } catch (err) {
        console.error('Error sending deadline reminders:', err);
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', { message: 'Page not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).render('error', { message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
