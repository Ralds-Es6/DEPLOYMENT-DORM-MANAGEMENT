import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
    sendMessage,
    getMessages,
    getConversations,
    markAsRead
} from '../controllers/messageController.js';

const router = express.Router();

router.post('/', protect, sendMessage);

// Order matters: specific paths first before parameter paths
router.get('/conversations', protect, admin, getConversations);

// Get messages for current user (if user) or specific user (if admin)
router.get('/:userId?', protect, getMessages);

router.put('/read/:userId?', protect, markAsRead);

export default router;
