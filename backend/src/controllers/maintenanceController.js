import MaintenanceRequest from '../models/MaintenanceRequest.js';
import Room from '../models/Room.js';

// @desc    Create maintenance request
// @route   POST /api/maintenance
// @access  Private (Tenant)
export const createMaintenanceRequest = async (req, res) => {
  try {
    const { roomId, description, priority } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    const request = await MaintenanceRequest.create({
      room: roomId,
      requestedBy: req.user._id,
      description,
      priority
    });

    const populatedRequest = await MaintenanceRequest.findById(request._id)
      .populate('room', 'number floor')
      .populate('requestedBy', 'name userId');

    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get all maintenance requests (filtered by role)
// @route   GET /api/maintenance
// @access  Private
export const getMaintenanceRequests = async (req, res) => {
  try {
    let requests;
    if (req.user.isAdmin || req.user.role === 'admin') {
      // Admins see all requests
      requests = await MaintenanceRequest.find()
        .populate('room', 'number floor')
        .populate('requestedBy', 'name userId')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });
    } else {
      // Tenants see only their requests
      requests = await MaintenanceRequest.find({ requestedBy: req.user._id })
        .populate('room', 'number floor')
        .populate('requestedBy', 'name userId')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 });
    }
    res.json(requests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Update maintenance request
// @route   PUT /api/maintenance/:id
// @access  Private/Admin
export const updateMaintenanceRequest = async (req, res) => {
  try {
    const { status, assignedTo, notes } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error('Maintenance request not found');
    }

    if (status) {
      request.status = status;
      if (status === 'completed') {
        request.completedAt = new Date();
      }
    }

    if (assignedTo) {
      request.assignedTo = assignedTo;
    }

    if (notes) {
      request.notes.push({
        text: notes,
        addedBy: req.user._id
      });
    }

    const updatedRequest = await request.save();
    const populatedRequest = await MaintenanceRequest.findById(updatedRequest._id)
      .populate('room', 'number floor')
      .populate('requestedBy', 'name')
      .populate('assignedTo', 'name')
      .populate('notes.addedBy', 'name');

    res.json(populatedRequest);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get maintenance request by ID
// @route   GET /api/maintenance/:id
// @access  Private
export const getMaintenanceRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('room', 'number floor')
      .populate('requestedBy', 'name')
      .populate('assignedTo', 'name')
      .populate('notes.addedBy', 'name');

    if (!request) {
      res.status(404);
      throw new Error('Maintenance request not found');
    }

    // Check if user has access to this request
    if (!req.user.isAdmin && !req.user.role === 'admin' && 
        request.requestedBy._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this maintenance request');
    }

    res.json(request);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Delete maintenance request
// @route   DELETE /api/maintenance/:id
// @access  Private/Admin
export const deleteMaintenanceRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      res.status(404);
      throw new Error('Maintenance request not found');
    }

    await request.remove();
    res.json({ message: 'Maintenance request removed' });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message,
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};