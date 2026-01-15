import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
    const { content, recipientId } = req.body;

    if (!content) {
        res.status(400);
        throw new Error('Message content is required');
    }

    const messageData = {
        sender: req.user._id,
        content,
        isAdminMessage: req.user.isAdmin // Auto-detect if sender is admin
    };

    // If sender is admin, they MUST specify a recipient (the student)
    if (req.user.isAdmin) {
        if (!recipientId) {
            res.status(400);
            throw new Error('Admins must specify a recipient');
        }
        messageData.recipient = recipientId;
    } else {
        // If sender is a user, recipient is null (Admins)
        messageData.recipient = null;
    }

    const message = await Message.create(messageData);

    // Populate sender info for immediate frontend display
    await message.populate('sender', 'name email userId');

    res.status(201).json(message);
});

// @desc    Get messages involves the current user (User side) or specific user (Admin side)
// @route   GET /api/messages/:userId?
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
    let targetUserId;

    if (req.user.isAdmin) {
        // Admin request: Get chat with specific user
        targetUserId = req.params.userId;
        if (!targetUserId) {
            // If no user specified, maybe return error or empty? 
            // We will handle "Conversations List" in a separate endpoint.
            res.status(400);
            throw new Error('User ID required for admin to view chat');
        }
    } else {
        // User request: Get their own chat
        targetUserId = req.user._id;
    }

    // Find messages where:
    // 1. Sender is TargetUser AND Recipient is Null (User -> Admin)
    // 2. Sender is Admin (Any Admin) AND Recipient is TargetUser (Admin -> User)
    // 3. Sender is TargetUser AND Recipient is Admin (if we ever support Admin-to-Admin?) - Ignore for now

    // Actually, simplified logic:
    // We want all messages "belonging" to this conversation log.
    // The conversation is defined by the Student/User.

    const messages = await Message.find({
        $or: [
            { sender: targetUserId, recipient: null }, // User sent to Admin
            { recipient: targetUserId, isAdminMessage: true } // Admin sent to User
        ]
    })
        .sort({ createdAt: 1 }) // Oldest first (chat log style)
        .populate('sender', 'name email userId');

    res.json(messages);
});

// @desc    Get list of conversations (Admin only)
// @route   GET /api/messages/conversations
// @access  Private/Admin
export const getConversations = asyncHandler(async (req, res) => {
    // We need to find all unique users who have sent messages OR received messages

    // 1. Find all messages
    // This aggregate is expensive on huge data, but fine for dorm scale.
    // We want the latest message per user.

    const conversations = await Message.aggregate([
        // Sort by newest first to get latest message easily
        { $sort: { createdAt: -1 } },
        // Group by the "User" involved.
        // If sender is User (isAdminMessage=false), User is sender.
        // If sender is Admin (isAdminMessage=true), User is recipient.
        {
            $group: {
                _id: {
                    $cond: [
                        { $eq: ["$isAdminMessage", true] },
                        "$recipient", // If admin msg, group by recipient
                        "$sender"     // If user msg, group by sender
                    ]
                },
                lastMessage: { $first: "$$ROOT" },
                unreadCount: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ["$isAdminMessage", false] }, { $eq: ["$isRead", false] }] },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        // Join with User collection to get names
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo"
            }
        },
        { $unwind: "$userInfo" }, // Deconstruct array
        {
            $project: {
                userId: "$_id",
                userName: "$userInfo.name",
                userEmail: "$userInfo.email",
                userType: "$userInfo.userId", // Student ID
                lastMessageContent: "$lastMessage.content",
                lastMessageTime: "$lastMessage.createdAt",
                unreadCount: 1
            }
        },
        { $sort: { lastMessageTime: -1 } } // Show recent convos first
    ]);

    res.json(conversations);
});

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
    // If admin calls, mark User->Admin messages as read
    // If user calls, mark Admin->User messages as read

    let filter = {};

    if (req.user.isAdmin) {
        const targetUserId = req.params.userId;
        filter = {
            sender: targetUserId,
            isAdminMessage: false,
            isRead: false
        };
    } else {
        filter = {
            recipient: req.user._id,
            isAdminMessage: true,
            isRead: false
        };
    }

    await Message.updateMany(filter, { isRead: true });

    res.status(200).json({ success: true });
});
