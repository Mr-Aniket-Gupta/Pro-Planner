const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/Message');

// Get conversation history with pagination (cursor by timestamp)
router.get('/history', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { withUserId, cursor, limit = 50 } = req.query;

        if (!userId || !withUserId) {
            return res.status(400).json({ error: 'Missing userId or withUserId' });
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(withUserId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const q = {
            $or: [
                { from: new mongoose.Types.ObjectId(userId), to: new mongoose.Types.ObjectId(withUserId) },
                { from: new mongoose.Types.ObjectId(withUserId), to: new mongoose.Types.ObjectId(userId) }
            ]
        };

        if (cursor) {
            const cursorDate = new Date(Number(cursor));
            if (isNaN(cursorDate.getTime())) {
                return res.status(400).json({ error: 'Invalid cursor format' });
            }
            q.ts = { $lt: cursorDate };
        }

        const items = await Message.find(q).sort({ ts: -1 }).limit(Math.min(+limit, 100));
        return res.json({ items, nextCursor: items.at(-1)?.ts?.getTime() });
    } catch (e) {
        console.error('history error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get unread counts grouped by sender
router.get('/unread-counts', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const rows = await Message.aggregate([
            { $match: { to: new mongoose.Types.ObjectId(userId), read: false } },
            { $group: { _id: '$from', count: { $sum: 1 } } }
        ]);
        res.json(rows);
    } catch (e) {
        console.error('unread-counts error:', e);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
    try {
        const userId = req.session.userId;
        const { messageId } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID format' });
        }

        if (!messageId) {
            return res.status(400).json({ success: false, message: 'Message ID is required' });
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
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check if user is the sender of the message
        if (message.from.toString() !== userId) {
            return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
        }

        // Delete the message from database
        await Message.findByIdAndDelete(message._id);

        // Emit socket event to notify other users about message deletion
        const io = req.app.get('io');
        if (io) {
            io.emit('chat:messageDeleted', {
                messageId: messageId,
                fromUserId: message.from.toString(),
                toUserId: message.to.toString()
            });
        }

        res.json({
            success: true,
            message: 'Message deleted successfully',
            deletedMessageId: messageId
        });

    } catch (e) {
        console.error('Delete message error:', e);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
});

module.exports = router;


