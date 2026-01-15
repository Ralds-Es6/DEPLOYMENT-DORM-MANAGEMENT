import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // If null, it means the message is intended for "Admins" (System)
        default: null
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isAdminMessage: {
        type: Boolean,
        default: false,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for faster queries
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
