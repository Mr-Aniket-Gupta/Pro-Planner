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

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/task');

// API routes
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userDataRoutes = require('./routes/userDataRoutes');

dotenv.config();
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());



app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// OTP store (in-memory)
const otpStore = {}; // { email: { otp, expiresAt } }

// Helper: OTP generate
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Routes
app.get('/', async (req, res) => {
    let isLoggedIn = false;
    // Session check
    if (req.session && req.session.userId) {
        isLoggedIn = true;
    } else if (req.cookies && req.cookies.proplanner_token) {
        // JWT cookie check (agar future me set ho)
        try {
            const decoded = jwt.verify(req.cookies.proplanner_token, process.env.JWT_SECRET || 'supersecretjwtkey');
            if (decoded && decoded.userId) isLoggedIn = true;
        } catch (e) { }
    }
    res.render('landing', { isLoggedIn });
});

app.get('/auth', (req, res) => res.render('auth'));

// Signup (Step 1: Send OTP or direct for Super Admin)
app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.send('Passwords do not match');
    }

    // Check if email already exists in any user
    const existingUser = await User.findOne({ 'emails.email': email });
    if (existingUser) return res.send('Email already exists');

    // Super Admin direct signup (no OTP)
    if (email === 'admin@gmail.com') {
        const hashed = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            password: hashed,
            emails: [{
                email,
                verified: true,
                isPrimary: true,
                addedAt: new Date()
            }]
        });
        await newUser.save();
        req.session.userId = newUser._id;
        return res.send('Signup successful!');
    }

    // OTP generate & store (normal users)
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

// Signup (Step 2: Verify OTP)
app.post('/verify-signup-otp', async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
        return res.send('Invalid or expired OTP');
    }
    // User create karo
    const hashed = await bcrypt.hash(record.data.password, 10);
    const newUser = new User({
        name: record.data.name,
        password: hashed,
        emails: [{
            email,
            verified: true,
            isPrimary: true,
            addedAt: new Date()
        }]
    });
    await newUser.save();
    delete otpStore[email];
    req.session.userId = newUser._id;
    res.send('Signup successful!');
});

// Login (Step 1: Send OTP or direct for Super Admin)
app.post('/login', async (req, res) => {
    const { email, password, remember } = req.body;

    // Find user by any of their verified emails
    const user = await User.findOne({ 'emails.email': email, 'emails.verified': true });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send('Invalid email or password');
    }

    // Super Admin direct login (no OTP)
    if (email === 'admin@gmail.com') {
        req.session.userId = user._id;
        if (remember) {
            req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;
        } else {
            req.session.cookie.expires = false;
        }
        // JWT generate karo
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: remember ? '14d' : '1d' });
        return res.json({ message: 'Login successful!', token });
    }

    // OTP generate & store (normal users)
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

// Login (Step 2: Verify OTP)
app.post('/verify-login-otp', async (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];
    if (!record || record.otp !== otp || record.expiresAt < Date.now()) {
        return res.send('Invalid or expired OTP');
    }
    // Session set karo
    req.session.userId = record.data.userId;
    if (record.data.remember) {
        req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000;
    } else {
        req.session.cookie.expires = false;
    }
    // JWT generate karo
    const token = jwt.sign({ userId: record.data.userId }, process.env.JWT_SECRET || 'supersecretjwtkey', { expiresIn: record.data.remember ? '14d' : '1d' });
    delete otpStore[email];
    res.json({ message: 'Login successful!', token });
});

// Auto-login endpoint (JWT verify)
app.post('/auto-login', async (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey');
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'Invalid token' });
        req.session.userId = user._id;
        return res.json({ message: 'Auto-login successful!' });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// Dashboard view (JWT bhi allow karo)
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/auth');
    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
});

// Voice test page
app.get('/voice-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'voice-test.html'));
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/auth'));
});

// // Project API (for local use — optional)
// app.post('/projects', async (req, res) => {
//     if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
//     const { name, desc, basic, advanced } = req.body;
//     try {
//         const project = await Project.create({
//             name,
//             desc,
//             basic: Array.isArray(basic) ? basic : [basic],
//             advanced: Array.isArray(advanced) ? advanced : [advanced],
//             user: req.session.userId
//         });
//         res.json({ success: true, project });
//     } catch (err) {
//         res.status(500).json({ error: 'Failed to create project' });
//     }
// });

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/userdata', userDataRoutes);

// Nodemailer transporter setup (yahan apna email aur app password daalein)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aniketgupta721910@gmail.com', // yahan apna email daalein
        pass: 'ngwf udjw pgui rvbt'     // yahan apna app password daalein (Gmail ke liye app password use karein)
    }
});

// Daily cron job: har din 5:02 PM
cron.schedule('09 17 * * *', async () => { // 5:02 PM
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        // All users
        const users = await User.find({});
        for (const user of users) {
            // User's incomplete projects
            const projects = await Project.find({ userId: user._id, completed: false });
            let emailContent = `Hello ${user.name || ''},\n\nHere are your projects and tasks with deadlines today:\n`;
            let hasTasks = false;
            // TODAY's DEADLINES
            for (const project of projects) {
                // Project's tasks with today's deadline and not completed
                const tasks = await Task.find({
                    projectId: project._id,
                    dueDate: { $gte: today, $lt: tomorrow },
                    completed: false
                });
                if (tasks.length > 0) {
                    hasTasks = true;
                    emailContent += `\nProject: ${project.name} (Project Due: ${project.deadline ? project.deadline.toLocaleDateString() : 'No deadline'})\n`;
                    tasks.forEach(task => {
                        emailContent += `  - Task: ${task.text} (Task Due: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'})\n`;
                    });
                }
            }
            // UPCOMING DEADLINES (Next 7 days, excluding today)
            let hasUpcoming = false;
            let upcomingContent = '\nUpcoming Deadlines (Next 7 days):\n';
            for (const project of projects) {
                // Project's tasks with deadline in next 7 days (excluding today) and not completed
                const tasks = await Task.find({
                    projectId: project._id,
                    dueDate: { $gte: tomorrow, $lt: nextWeek },
                    completed: false
                });
                if (tasks.length > 0) {
                    hasUpcoming = true;
                    upcomingContent += `\nProject: ${project.name} (Project Due: ${project.deadline ? project.deadline.toLocaleDateString() : 'No deadline'})\n`;
                    tasks.forEach(task => {
                        upcomingContent += `  - Task: ${task.text} (Task Due: ${task.dueDate ? task.dueDate.toLocaleDateString() : 'No due date'})\n`;
                    });
                }
            }
            if (hasUpcoming) {
                emailContent += upcomingContent;
            }
            if (hasTasks || hasUpcoming) {
                emailContent += '\n- ProPlanner Team';

                // Send to all verified emails
                const verifiedEmails = user.emails.filter(e => e.verified).map(e => e.email);
                for (const email of verifiedEmails) {
                    const mailOptions = {
                        from: 'aniketgupta721910@gmail.com',
                        to: email,
                        subject: "Today's & Upcoming Task/Project Deadline Reminder",
                        text: emailContent
                    };
                    try {
                        await transporter.sendMail(mailOptions);
                        console.log(`Reminder sent to ${email}`);
                    } catch (error) {
                        console.error(`Failed to send reminder to ${email}:`, error);
                    }
                }
            }
        }
        console.log('All users have been sent their project/task deadline reminders!');
    } catch (err) {
        console.error('Error sending deadline reminders:', err);
    }
});

// server.js या app.js में (ऊपर require और app initialization के बाद)
app.get('/contact', (req, res) => {
  res.render('contact'); // contact.ejs को render करेगा
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(` Server running at http://localhost:${PORT}`));
