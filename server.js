const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

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
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
app.get('/', (req, res) => res.redirect('/auth'));

app.get('/auth', (req, res) => res.render('auth'));

// Signup (Step 1: Send OTP)
app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        return res.send('Passwords do not match');
    }
    const userExists = await User.findOne({ email });
    if (userExists) return res.send('User already exists');
    // OTP generate & store
    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, data: { name, email, password } };
    // Email bhejo (English)
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
    const newUser = new User({ name: record.data.name, email, password: hashed });
    await newUser.save();
    delete otpStore[email];
    req.session.userId = newUser._id;
    res.send('Signup successful!');
});

// Login (Step 1: Send OTP)
app.post('/login', async (req, res) => {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send('Invalid email or password');
    }
    // OTP generate & store
    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, data: { userId: user._id, remember } };
    await transporter.sendMail({
        from: 'aniketgupta721910@gmail.com',
        to: email,
        subject: 'ProPlanner Login OTP',
        text: `Your OTP for ProPlanner login is: ${otp}\nThis OTP is valid for 5 minutes.`
    });
    res.send('OTP sent to your email. Please verify.');
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
    delete otpStore[email];
    res.send('Login successful!');
});

// Dashboard view
app.get('/dashboard', async (req, res) => {
    if (!req.session.userId) return res.redirect('/auth');

    const user = await User.findById(req.session.userId);
    res.render('dashboard', { user });
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
        today.setHours(0,0,0,0);
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
                const mailOptions = {
                    from: 'aniketgupta721910@gmail.com',
                    to: user.email,
                    subject: "Today's & Upcoming Task/Project Deadline Reminder",
                    text: emailContent
                };
                await transporter.sendMail(mailOptions);
            }
        }
        console.log('All users have been sent their project/task deadline reminders!');
    } catch (err) {
        console.error('Error sending deadline reminders:', err);
    }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
