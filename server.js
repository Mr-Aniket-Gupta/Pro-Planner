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

const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userDataRoutes = require('./routes/userDataRoutes');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// In-memory map of userId -> Set of sockets for real-time chat
const userIdToSockets = new Map();

// Initialize socket connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Client should immediately register with their userId
    socket.on('register', (userId) => {
        if (!userId) return;
        socket.userId = userId;
        const set = userIdToSockets.get(userId) || new Set();
        set.add(socket);
        userIdToSockets.set(userId, set);
        socket.emit('registered', { ok: true });
    });

    // Handle outgoing chat messages: { to, text }
    socket.on('chat:send', (payload) => {
        try {
            if (!payload || !payload.to || typeof payload.text !== 'string') return;
            const from = socket.userId;
            if (!from) return;
            const to = payload.to;
            const message = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                from,
                to,
                text: payload.text,
                ts: Date.now(),
            };
            // Echo back to sender for confirmation
            socket.emit('chat:message', message);
            // Deliver to recipient if online
            const recipientSockets = userIdToSockets.get(to);
            if (recipientSockets) {
                recipientSockets.forEach(s => s.emit('chat:message', message));
            }
        } catch (e) {
            console.error('chat:send error', e);
        }
    });

    socket.on('disconnect', () => {
        const { userId } = socket;
        if (userId && userIdToSockets.has(userId)) {
            const set = userIdToSockets.get(userId);
            set.delete(socket);
            if (set.size === 0) userIdToSockets.delete(userId);
        }
        console.log('A user disconnected:', socket.id);
    });
});

// Export socket instance for use in other files
module.exports.io = io;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error(err));

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
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) return res.send('Passwords do not match');

    const existingUser = await User.findOne({ 'emails.email': email });
    if (existingUser) return res.send('Email already exists');

    if (email === 'admin@gmail.com') {
        const hashed = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            password: hashed,
            emails: [{ email, verified: true, isPrimary: true, addedAt: new Date() }]
        });
        await newUser.save();
        req.session.userId = newUser._id;
        return res.send('Signup successful!');
    }

    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, data: { name, email, password } };
    await transporter.sendMail({
        from: 'aniketgupta721910@gmail.com',
        to: email,
        subject: 'ProPlanner Signup OTP',
        text: `Your OTP for ProPlanner signup is: ${otp}\nThis OTP is valid for 5 minutes.`
    });
    res.send('OTP sent to your email. Please verify.');
});

// Signup - Step 2: Verify OTP
app.post('/verify-signup-otp', async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
        return res.send('Invalid or expired OTP');
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
});

// Login - Step 1: Send OTP or direct login for Super Admin
app.post('/login', async (req, res) => {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ 'emails.email': email, 'emails.verified': true });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send('Invalid email or password');
    }

    if (email === 'admin@gmail.com') {
        req.session.userId = user._id;
        req.session.cookie.maxAge = remember ? 14 * 24 * 60 * 60 * 1000 : null;

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'supersecretjwtkey', {
            expiresIn: remember ? '14d' : '1d'
        });
        return res.json({ message: 'Login successful!', token });
    }

    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, data: { userId: user._id, remember } };
    await transporter.sendMail({
        from: 'aniketgupta721910@gmail.com',
        to: email,
        subject: 'ProPlanner Login OTP',
        text: `Your OTP for ProPlanner login is: ${otp}\nThis OTP is valid for 5 minutes.`
    });
    res.json({ message: 'OTP sent to your email. Please verify.' });
});

// Login - Step 2: Verify OTP
app.post('/verify-login-otp', async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
        return res.send('Invalid or expired OTP');
    }

    req.session.userId = record.data.userId;
    req.session.cookie.maxAge = record.data.remember ? 14 * 24 * 60 * 60 * 1000 : null;

    const token = jwt.sign({ userId: record.data.userId }, process.env.JWT_SECRET || 'supersecretjwtkey', {
        expiresIn: record.data.remember ? '14d' : '1d'
    });
    delete otpStore[email];
    res.json({ message: 'Login successful!', token });
});

// Auto-login using JWT token
app.post('/auto-login', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        req.session.userId = user._id;
        return res.json({ message: 'Auto-login successful!' });
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// Dashboard page (session required)
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/auth');
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth'));
});

// Contact page
app.get('/contact', (req, res) => {
    res.render('contact');
});

// API routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/userdata', userDataRoutes);

// Email transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aniketgupta721910@gmail.com',
        pass: 'ngwf udjw pgui rvbt'
    }
});

// Daily cron job to email task reminders at 5:09 PM
cron.schedule('09 17 * * *', async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const users = await User.find({});
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
                            from: 'aniketgupta721910@gmail.com',
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
        console.log('All reminders sent successfully!');
    } catch (err) {
        console.error('Error sending deadline reminders:', err);
    }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
