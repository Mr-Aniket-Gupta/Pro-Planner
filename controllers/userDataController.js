const User = require('../models/User');
const Todo = require('../models/Todo');
const Note = require('../models/Note');

// Get todos and notes for the logged-in user
exports.getUserData = async (req, res) => {
    try {
        const userId = req.session.userId;
        const todos = await Todo.find({ userId });
        const note = await Note.findOne({ userId });
        res.json({ todos, notes: note ? note.content : '' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
};

// Replace all todos for the logged-in user
exports.updateTodos = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { todos } = req.body;
        await Todo.deleteMany({ userId });
        const newTodos = await Todo.insertMany(todos.map(t => ({ ...t, userId })));
        res.json({ todos: newTodos });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update todos' });
    }
};

// Update notes for the logged-in user
exports.updateNotes = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { notes } = req.body;
        const note = await Note.findOneAndUpdate(
            { userId },
            { content: notes },
            { new: true, upsert: true }
        );
        res.json({ notes: note.content });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notes' });
    }
};

// Search users by name or email (excluding self)
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.body;
        const userId = req.session.userId;
        const regex = new RegExp(q, 'i');
        const users = await User.find({
            $and: [
                { _id: { $ne: userId } },
                { $or: [ { name: regex }, { 'emails.email': regex } ] }
            ]
        }).select('name emails');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to search users' });
    }
};

// Send a connection request to another user
exports.sendConnectionRequest = async (req, res) => {
    try {
        const fromId = req.session.userId;
        const { toUserId } = req.body;
        if (fromId === toUserId) return res.status(400).json({ error: 'Cannot connect to yourself' });
        const fromUser = await User.findById(fromId);
        const toUser = await User.findById(toUserId);
        if (!fromUser || !toUser) return res.status(404).json({ error: 'User not found' });
        if (fromUser.connections.includes(toUserId)) return res.status(400).json({ error: 'Already connected' });
        if (fromUser.sentRequests.includes(toUserId)) return res.status(400).json({ error: 'Request already sent' });
        fromUser.sentRequests.push(toUserId);
        toUser.pendingRequests.push(fromId);
        await fromUser.save();
        await toUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send connection request' });
    }
};

// Accept a connection request
exports.acceptConnectionRequest = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { fromUserId } = req.body;
        const user = await User.findById(userId);
        const fromUser = await User.findById(fromUserId);
        if (!user || !fromUser) return res.status(404).json({ error: 'User not found' });
        user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== fromUserId);
        fromUser.sentRequests = fromUser.sentRequests.filter(id => id.toString() !== userId);
        user.connections.push(fromUserId);
        fromUser.connections.push(userId);
        await user.save();
        await fromUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to accept connection request' });
    }
};

// Get all pending connection requests for the logged-in user
exports.getPendingRequests = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('pendingRequests', 'name emails');
        res.json(user.pendingRequests || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get pending requests' });
    }
};

// Get all connections (friends) for the logged-in user
exports.getConnections = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).populate('connections', 'name emails');
        res.json(user.connections || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get connections' });
    }
};

// Remove a friend and all project access between the two users
exports.removeConnection = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { userId: friendId } = req.body;
        if (!userId || !friendId) return res.status(400).json({ error: 'Missing userId' });
        if (userId === friendId) return res.status(400).json({ error: 'Cannot remove yourself' });
        const UserModel = require('../models/User');
        const Project = require('../models/Project');
        const user = await UserModel.findById(userId);
        const friend = await UserModel.findById(friendId);
        if (!user || !friend) return res.status(404).json({ error: 'User not found' });
        user.connections = user.connections.filter(id => id.toString() !== friendId);
        friend.connections = friend.connections.filter(id => id.toString() !== userId);
        await user.save();
        await friend.save();
        await Project.updateMany(
            { userId: userId },
            { $pull: { sharedWith: { user: friendId } } }
        );
        await Project.updateMany(
            { userId: friendId },
            { $pull: { sharedWith: { user: userId } } }
        );
        friend.projectAccessRequests = friend.projectAccessRequests.filter(r => r.requestedBy.toString() !== userId);
        user.projectAccessRequests = user.projectAccessRequests.filter(r => r.requestedBy.toString() !== friendId);
        await user.save();
        await friend.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove connection' });
    }
};

// Get social links for the logged-in user
exports.getSocialLinks = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId).select('socialLinks');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ socialLinks: user.socialLinks || [] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch social links' });
    }
};

// Update social links for the logged-in user
exports.updateSocialLinks = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { socialLinks } = req.body;
        
        // Validate the social links structure
        if (Array.isArray(socialLinks)) {
            for (const link of socialLinks) {
                if (!link.type || !['project', 'social'].includes(link.type)) {
                    return res.status(400).json({ error: 'Invalid link type' });
                }
                if (!link.name || !link.url) {
                    return res.status(400).json({ error: 'Name and URL are required' });
                }
                if (link.type === 'project' && !link.projectId) {
                    return res.status(400).json({ error: 'Project ID is required for project links' });
                }
            }
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { socialLinks: socialLinks || [] },
            { new: true }
        ).select('socialLinks');
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ socialLinks: user.socialLinks });
    } catch (err) {
        console.error('Update social links error:', err);
        res.status(500).json({ error: 'Failed to update social links' });
    }
};

// Get notification counts for the logged-in user
exports.getNotificationCounts = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Get pending friend requests count
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const friendRequestsCount = user.pendingRequests ? user.pendingRequests.length : 0;

        res.json({
            friendRequests: friendRequestsCount,
            sharedWithMe: 0, // This will be calculated from project routes
            accessRequests: 0 // This will be calculated from project routes
        });
    } catch (err) {
        console.error('Get notification counts error:', err);
        res.status(500).json({ error: 'Failed to get notification counts' });
    }
}; 