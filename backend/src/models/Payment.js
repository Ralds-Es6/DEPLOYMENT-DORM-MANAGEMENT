import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        roomAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomAssignment',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        paymentMethod: {
            type: String,
            enum: ['gcash', 'cash'],
            required: true
        },
        referenceNumber: {
            type: String, // GCash Reference Number
            default: null
        },
        proofImage: {
            type: String, // URL to the uploaded screenshot
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending'
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        remarks: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
