const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const dotenv = require('dotenv');

const User = require('./models/User');
const Project = require('./models/Project');

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

// Routes
app.get('/', (req, res) => res.redirect('/auth'));

app.get('/auth', (req, res) => res.render('auth'));

// Signup
app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.send('Passwords do not match');
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.send('User already exists');

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashed });
    await newUser.save();

    req.session.userId = newUser._id;
    res.redirect('/dashboard');
});

// Login
app.post('/login', async (req, res) => {
    const { email, password, remember } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.send('Invalid email or password');
    }

    req.session.userId = user._id;
    // Remember me logic
    if (remember) {
        req.session.cookie.maxAge = 14 * 24 * 60 * 60 * 1000; // 14 din
    } else {
        req.session.cookie.expires = false; // Session cookie
    }
    res.redirect('/dashboard');
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

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
