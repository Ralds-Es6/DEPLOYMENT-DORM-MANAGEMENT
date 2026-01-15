import Payment from '../models/Payment.js';
import RoomAssignment from '../models/RoomAssignment.js';
import Room from '../models/Room.js';

// Submit a Payment (User Side)
export const submitPayment = async (req, res) => {
    try {
        const { roomAssignmentId, amount, paymentMethod, referenceNumber } = req.body;
        const userId = req.user._id;

        // Find the booking
        const booking = await RoomAssignment.findById(roomAssignmentId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify ownership
        if (booking.requestedBy.toString() !== userId.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const paymentData = {
            roomAssignment: roomAssignmentId,
            user: userId,
            amount,
            paymentMethod,
            referenceNumber: paymentMethod === 'gcash' ? referenceNumber : null,
            status: 'pending' // Pending verification
        };

        if (req.file) {
            paymentData.proofImage = `/uploads/${req.file.filename}`;
        }

        const payment = await Payment.create(paymentData);

        // Update Booking Status based on Method
        if (paymentMethod === 'gcash') {
            booking.status = 'verification_pending';
        } else {
            booking.status = 'payment_pending'; // For cash/counter
        }
        await booking.save();

        res.status(201).json({ message: 'Payment submitted successfully', payment });
    } catch (error) {
        console.error('Submit Payment Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Payments (Admin: All, User: Theirs)
export const getPayments = async (req, res) => {
    try {
        let query = {};
        if (!req.user.isAdmin) {
            query.user = req.user._id;
        }

        const payments = await Payment.find(query)
            .populate('user', 'name email')
            .populate({
                path: 'roomAssignment',
                select: 'referenceNumber room',
                populate: { path: 'room', select: 'number' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Verify Payment (Admin Only)
export const verifyPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { status, remarks } = req.body; // status: 'verified' or 'rejected'

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }

        payment.status = status;
        payment.verifiedBy = req.user._id;
        payment.remarks = remarks;
        await payment.save();

        // If verified, approve the booking!
        if (status === 'verified') {
            const booking = await RoomAssignment.findById(payment.roomAssignment);
            if (booking) {
                booking.status = 'approved';
                // Note: The RoomAssignment middleware will automatically handle occupancy increment!
                await booking.save();
            }
        } else if (status === 'rejected') {
            // If rejected, maybe revert booking to awaiting_payment so they can try again?
            const booking = await RoomAssignment.findById(payment.roomAssignment);
            if (booking) {
                booking.status = 'awaiting_payment';
                await booking.save();
            }
        }

        res.status(200).json({ message: `Payment ${status}`, payment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
