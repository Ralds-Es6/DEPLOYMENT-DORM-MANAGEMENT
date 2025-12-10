import RoomAssignment from '../models/RoomAssignment.js';
import Room from '../models/Room.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all assignments (filtered by role)
// @route   GET /api/assignments
// @access  Private
export const getAssignments = asyncHandler(async (req, res) => {
  try {
    console.log('User requesting assignments:', req.user._id); // Debug log

    let assignments;
    if (req.user.isAdmin) {
      // Admins see all assignments
      assignments = await RoomAssignment.find()
        .populate({
          path: 'requestedBy',
          select: 'name email userId mobileNumber _id'
        })
        .populate('room', 'number type capacity occupied')
        .populate('checkedOutBy', 'name email')
        .sort('-createdAt');
    } else {
      // Users see only their own assignments
      assignments = await RoomAssignment.find({ 
        requestedBy: req.user._id 
      })
        .populate({
          path: 'requestedBy',
          select: 'name email userId mobileNumber _id'
        })
        .populate('room', 'number type capacity occupied')
        .populate('checkedOutBy', 'name email')
        .sort('-createdAt');
    }

    // Remove assignments whose associated user record no longer exists
    assignments = assignments.filter(assignment => assignment.requestedBy);

    console.log('Found assignments:', assignments.length); // Debug log
    res.json(assignments);
  } catch (error) {
    console.error('Error in getAssignments:', error); // Debug log
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get assignment by ID
// @route   GET /api/assignments/:id
// @access  Private/Admin
export const getAssignmentById = asyncHandler(async (req, res) => {
  try {
    const assignment = await RoomAssignment.findById(req.params.id)
      .populate('room', 'number floor type')
      .populate('userId', 'name email');

    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    res.json(assignment);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
});

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private
export const createAssignment = asyncHandler(async (req, res) => {
  try {
    const { roomId, startDate, endDate, totalPrice } = req.body;

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }
    if (room.status !== 'available') {
      res.status(400);
      throw new Error('Room is not available for assignment');
    }

    // Calculate price if not provided
    let finalPrice = totalPrice;
    if (!finalPrice) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dailyRate = room.monthlyRate / 30;
      finalPrice = Math.round(dailyRate * diffDays);
    }

    // Check if user already has an active or pending assignment
    const existingAssignment = await RoomAssignment.findOne({
      requestedBy: req.user._id,
      status: { $in: ['pending', 'active'] }
    });

    if (existingAssignment) {
      res.status(400);
      throw new Error('You already have a pending or active room assignment');
    }

    // Generate reference number: REF-DDMMYYYY-XXXXXX (e.g., REF-04122025-A12B3C)
    const generateReferenceNumber = async () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const datePart = `${day}${month}${year}`;
      
      // Generate a random alphanumeric code
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomCode = '';
      for (let i = 0; i < 6; i++) {
        randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const referenceNumber = `REF-${datePart}-${randomCode}`;
      
      // Check if reference number already exists (very unlikely but safe to check)
      const existing = await RoomAssignment.findOne({ referenceNumber });
      if (existing) {
        // Recursively generate new one if collision occurs
        return generateReferenceNumber();
      }
      
      return referenceNumber;
    };

    const referenceNumber = await generateReferenceNumber();

    // Get uploaded ID image path
    const idImage = req.file ? `/uploads/ids/${req.file.filename}` : null;

    if (!idImage) {
      res.status(400);
      throw new Error('ID image is required');
    }

    const assignment = await RoomAssignment.create({
      referenceNumber,
      requestedBy: req.user._id,
      room: roomId,
      startDate,
      endDate,
      status: 'pending',
      totalPrice: finalPrice,
      idImage
    });

    const populatedAssignment = await RoomAssignment.findById(assignment._id)
      .populate('requestedBy', 'name email')
      .populate('room', 'number floor type');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
});

// @desc    Update assignment status
// @route   PUT /api/assignments/:id
// @access  Private/Admin
export const updateAssignment = asyncHandler(async (req, res) => {
  try {
    const { status, notes } = req.body;
    console.log(`[Assignment Controller] Updating assignment ${req.params.id} to status: ${status}`);
    
    const assignment = await RoomAssignment.findById(req.params.id);

    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    console.log(`[Assignment Controller] Current assignment status: ${assignment.status}, New status: ${status}`);

    // Update assignment status
    // Occupancy changes are handled by RoomAssignment middleware based on status transitions
    const previousStatus = assignment.status;
    assignment.status = status || assignment.status;
    if (notes) assignment.notes = notes;

    // Set approval time when status transitions to 'approved'
    if (previousStatus !== 'approved' && status === 'approved' && !assignment.approvalTime) {
      assignment.approvalTime = new Date();
      console.log(`[Assignment Controller] Setting approval time: ${assignment.approvalTime}`);
    }

    console.log(`[Assignment Controller] Saving assignment with new status...`);
    const updatedAssignment = await assignment.save();
    console.log(`[Assignment Controller] Assignment saved successfully`);
    
    const populatedAssignment = await RoomAssignment.findById(updatedAssignment._id)
      .populate('requestedBy', 'name email')
      .populate('room', 'number type capacity occupied')
      .populate('checkedOutBy', 'name email');

    console.log(`[Assignment Controller] Populated room occupancy: ${populatedAssignment.room.occupied}/${populatedAssignment.room.capacity}`);
    res.json(populatedAssignment);
  } catch (error) {
    console.error(`[Assignment Controller] Error updating assignment: ${error.message}`);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
});

// @desc    Get pending assignments
// @route   GET /api/assignments/pending
// @access  Private/Admin
export const getPendingAssignments = asyncHandler(async (req, res) => {
  try {
    const assignments = await RoomAssignment.find({ status: 'pending' })
      .populate('requestedBy', 'name email userId mobileNumber')
      .populate('room', 'number floor type')
      .sort('-createdAt');
    
    // Filter out assignments where the user has been deleted
    const validAssignments = assignments.filter(assignment => assignment.requestedBy);
    res.json(validAssignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private/Admin
export const deleteAssignment = asyncHandler(async (req, res) => {
  try {
    const assignment = await RoomAssignment.findById(req.params.id);

    if (!assignment) {
      res.status(404);
      throw new Error('Assignment not found');
    }

    if (assignment.status === 'active') {
      res.status(400);
      throw new Error('Cannot delete an active assignment');
    }

    await assignment.remove();
    res.json({ message: 'Assignment removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({ message: error.message });
  }
});

// @desc    Check out from room (User only)
// @route   PUT /api/assignments/:id/checkout
// @access  Private (User)
export const checkoutAssignment = asyncHandler(async (req, res) => {
  try {
    const assignment = await RoomAssignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Verify that only the user who made the assignment can checkout
    if (assignment.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only checkout from your own room assignment'
      });
    }

    // Only allow checkout from approved or active assignments
    if (!['approved', 'active'].includes(assignment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot checkout from ${assignment.status} assignment. Only approved or active assignments can be checked out.`
      });
    }

    // Check if within 24 hours of approval for cancellation
    const approvalTime = new Date(assignment.approvalTime || assignment.createdAt);
    const now = new Date();
    const diffHours = Math.abs(now - approvalTime) / 36e5;
    
    if (diffHours <= 24) {
      // Within 24 hours: Cancel the booking (Refundable/Not counted in revenue)
      assignment.status = 'cancelled';
      assignment.notes = (assignment.notes || '') + ' [Cancelled by user within 24h grace period]';
    } else {
      // After 24 hours: Regular Checkout (Non-refundable/Counted in revenue)
      assignment.status = 'completed';
      assignment.checkOutTime = new Date();
      assignment.checkedOutBy = req.user._id;
    }

    await assignment.save();

    // Populate and return the updated assignment
    const populatedAssignment = await RoomAssignment.findById(assignment._id)
      .populate('requestedBy', 'name email')
      .populate('room', 'number type capacity occupied')
      .populate('checkedOutBy', 'name email');

    res.status(200).json({
      success: true,
      message: assignment.status === 'cancelled' ? 'Booking cancelled successfully' : 'Successfully checked out from room',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error during checkout'
    });
  }
});

// @desc    Get all completed assignments for printing/reporting (Admin only)
// @route   GET /api/assignments/print/transactions
// @access  Private/Admin
export const getPrintTransactions = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build filter query
    let filter = {};
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set end date to end of day
      end.setHours(23, 59, 59, 999);
      
      // Filter by both checkInTime and checkOutTime falling within the range
      filter.$or = [
        {
          checkInTime: {
            $gte: start,
            $lte: end
          }
        },
        {
          checkOutTime: {
            $gte: start,
            $lte: end
          }
        },
        {
          // Also include records where the stay spans across the date range
          checkInTime: { $lte: end },
          checkOutTime: { $gte: start }
        }
      ];
    }
    
    const assignments = await RoomAssignment.find(filter)
      .populate({
        path: 'requestedBy',
        select: 'name email userId mobileNumber'
      })
      .populate('room', 'number monthlyRate type')
      .populate('checkedOutBy', 'name')
      .sort('-checkOutTime');

    // Format data exactly like Dashboard Room Assignment History
    let totalRoomPrice = 0;
    const transactionsData = assignments.map(assignment => {
      const checkInDate = assignment.checkInTime || assignment.approvalTime || assignment.createdAt;
      const checkOutDate = assignment.checkOutTime;
      
      // Calculate duration in days
      let duration = 'Ongoing';
      if (checkOutDate && checkInDate) {
        const daysStayed = Math.floor((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
        duration = daysStayed + ' days';
      }
      
      // Get room price (monthly rate)
      const roomPrice = assignment.room?.monthlyRate || 0;
      totalRoomPrice += roomPrice;

      return {
        userId: assignment.requestedBy?.userId || 'N/A',
        studentName: assignment.requestedBy?.name || 'N/A',
        mobileNumber: assignment.requestedBy?.mobileNumber || 'N/A',
        roomNumber: assignment.room?.number || 'N/A',
        roomType: assignment.room?.type || 'N/A',
        roomPrice: roomPrice,
        status: assignment.status === 'completed' ? '✓ Check-out' : 
                (assignment.status === 'active' || assignment.status === 'approved') ? '✓ Check-in' : 'Pending',
        approvalTime: assignment.approvalTime,
        checkInTime: checkInDate,
        checkOutTime: checkOutDate,
        duration: duration,
        checkedOutBy: assignment.checkedOutBy?.name || null
      };
    });

    res.json({
      success: true,
      data: transactionsData,
      totalRoomPrice: totalRoomPrice.toFixed(2),
      totalRecords: transactionsData.length,
      printDate: new Date(),
      dateRange: startDate && endDate ? { startDate, endDate } : null
    });
  } catch (error) {
    console.error('Error fetching print transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching transactions for printing'
    });
  }
});