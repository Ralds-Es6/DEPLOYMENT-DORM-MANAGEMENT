import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import Room from '../models/Room.js';
import RoomAssignment from '../models/RoomAssignment.js';
import asyncHandler from '../utils/asyncHandler.js';

const toRelativeUploadPath = (filename) => path.posix.join('uploads/rooms', filename);

const buildImagePayload = (files = []) =>
  files.map((file) => toRelativeUploadPath(file.filename));

const sanitizeExistingImages = (payload, fallback) => {
  if (typeof payload === 'undefined' || payload === null) {
    return fallback;
  }

  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
    return fallback;
  } catch (error) {
    console.warn('Failed to parse existingImages payload', error);
    return fallback;
  }
};

const deleteRoomImagesFromDisk = (images = []) => {
  images.forEach((imagePath) => {
    if (!imagePath) return;
    const normalized = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const absolutePath = path.join(process.cwd(), normalized);
    fs.unlink(absolutePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Failed to delete image ${absolutePath}:`, err.message);
      }
    });
  });
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({});
  
  // Sync occupancy with actual active check-ins
  for (let room of rooms) {
    const activeCheckIns = await RoomAssignment.countDocuments({
      room: room._id,
      status: { $in: ['approved', 'active'] }
    });
    
    room.occupied = activeCheckIns;
    
    // Update room status based on occupancy
    // Only update status if it's not in maintenance mode
    if (room.status !== 'maintenance') {
      if (activeCheckIns === 0) {
        room.status = 'available';
      } else if (activeCheckIns >= room.capacity) {
        room.status = 'occupied';
      }
    }
    
    await room.save();
  }
  
  const updatedRooms = await Room.find({});
  res.json(updatedRooms);
});

// @desc    Get public rooms (limited info for browsing)
// @route   GET /api/rooms/public
// @access  Public
export const getPublicRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({}).select('number floor type images monthlyRate capacity occupied status description amenities');
  
  // Sync occupancy with actual active check-ins
  for (let room of rooms) {
    const activeCheckIns = await RoomAssignment.countDocuments({
      room: room._id,
      status: { $in: ['approved', 'active'] }
    });
    
    room.occupied = activeCheckIns;
    
    // Update room status based on occupancy
    // Only update status if it's not in maintenance mode
    if (room.status !== 'maintenance') {
      if (activeCheckIns === 0) {
        room.status = 'available';
      } else if (activeCheckIns >= room.capacity) {
        room.status = 'occupied';
      }
    }
    
    await room.save();
  }
  
  const updatedRooms = await Room.find({}).select('number floor type images monthlyRate capacity occupied status description amenities');
  res.json(updatedRooms);
});

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (room) {
    res.json(room);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private
export const createRoom = asyncHandler(async (req, res) => {
  const { number, floor, capacity, type, status, monthlyRate, description, amenities } = req.body;

  // Validation
  if (!number || !floor || !capacity || !type) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const roomExists = await Room.findOne({ number });
  if (roomExists) {
    return res.status(400).json({ message: 'Room number already exists' });
  }

  // Validate room type
  const validTypes = ['Standard', 'Single', 'Double', 'Suite'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ message: 'Invalid room type' });
  }

  const numericCapacity = Number(capacity);
  // Validate capacity
  if (Number.isNaN(numericCapacity) || numericCapacity < 1 || numericCapacity > 6) {
    return res.status(400).json({ message: 'Capacity must be between 1 and 6' });
  }

  const uploadedImages = buildImagePayload(req.files);

  let parsedAmenities = [];
  if (amenities) {
    if (Array.isArray(amenities)) {
      parsedAmenities = amenities;
    } else if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = amenities.split(',').map(a => a.trim()).filter(Boolean);
      }
    }
  }

  const room = await Room.create({
    number: number.trim(),
    floor: floor.toString(),
    capacity: numericCapacity,
    type,
    status: status || 'available',
    monthlyRate: Number(monthlyRate) || 0,
    description: description || '',
    amenities: parsedAmenities,
    images: uploadedImages
  });

  res.status(201).json(room);
});

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private
export const updateRoom = async (req, res) => {
  try {
    const { number, floor, capacity, type, status, monthlyRate, description, amenities } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Calculate active check-ins to ensure accuracy
    const activeCheckIns = await RoomAssignment.countDocuments({
      room: room._id,
      status: { $in: ['approved', 'active'] }
    });

    let numericCapacity;
    if (typeof capacity !== 'undefined') {
      numericCapacity = Number(capacity);
      if (Number.isNaN(numericCapacity)) {
        return res.status(400).json({ message: 'Capacity must be a valid number' });
      }
      if (numericCapacity < 1 || numericCapacity > 6) {
        return res.status(400).json({ message: 'Capacity must be between 1 and 6' });
      }
    }

    const targetCapacity = typeof numericCapacity !== 'undefined' ? numericCapacity : room.capacity;

    // Check if trying to set a fully occupied room to available
    if (status === 'available' && activeCheckIns >= targetCapacity) {
      return res.status(400).json({ 
        message: 'Cannot set a fully occupied room to available. Please ensure the room has available space first.' 
      });
    }

    // Check if trying to set room to occupied when not fully occupied
    if (status === 'occupied' && activeCheckIns < targetCapacity) {
      return res.status(400).json({ 
        message: 'Cannot set room to occupied. The room is not fully occupied yet.' 
      });
    }

    room.number = number || room.number;
    room.floor = floor || room.floor;
    room.capacity = typeof numericCapacity !== 'undefined' ? numericCapacity : room.capacity;
    room.type = type || room.type;
    room.status = status || room.status;
    if (typeof monthlyRate !== 'undefined') {
      room.monthlyRate = Number(monthlyRate) || 0;
    }
    if (typeof description !== 'undefined') {
      room.description = description;
    }
    if (typeof amenities !== 'undefined') {
      if (Array.isArray(amenities)) {
        room.amenities = amenities;
      } else if (typeof amenities === 'string') {
        try {
          room.amenities = JSON.parse(amenities);
        } catch (e) {
          room.amenities = amenities.split(',').map(a => a.trim()).filter(Boolean);
        }
      }
    }

    const payloadImages = sanitizeExistingImages(req.body.existingImages, room.images);
    const uploadedImages = buildImagePayload(req.files);

    const removedImages = room.images.filter((imagePath) => !payloadImages.includes(imagePath));
    if (removedImages.length) {
      deleteRoomImagesFromDisk(removedImages);
    }

    room.images = Array.from(new Set([...payloadImages, ...uploadedImages]));

    const updatedRoom = await room.save();
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404).json({ message: 'Room not found' });
      return;
    }

    // Check for active assignments
    const RoomAssignment = mongoose.model('RoomAssignment');
    const activeAssignment = await RoomAssignment.findOne({
      room: room._id,
      status: { $in: ['active', 'pending'] }
    });

    if (activeAssignment) {
      res.status(400).json({ message: 'Cannot delete room with active or pending assignments' });
      return;
    }

    if (room.occupied > 0) {
      res.status(400).json({ message: 'Cannot delete room with current occupants' });
      return;
    }

    if (room.images?.length) {
      deleteRoomImagesFromDisk(room.images);
    }

    await room.deleteOne();
    res.json({ message: 'Room removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request room assignment
// @route   POST /api/rooms/:id/request
// @access  Private (Tenant only)
export const requestRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.status(404);
      throw new Error('Room not found');
    }

    if (room.status !== 'available') {
      res.status(400);
      throw new Error('Room is not available for assignment');
    }

    const RoomAssignment = mongoose.model('RoomAssignment');
    
    // Check if user already has a pending or active assignment
    const existingAssignment = await RoomAssignment.findOne({
      requestedBy: req.user._id,
      status: { $in: ['pending', 'approved', 'active'] }
    });

    if (existingAssignment) {
      res.status(400);
      throw new Error('You already have a pending or active room assignment');
    }

    const assignment = await RoomAssignment.create({
      room: room._id,
      requestedBy: req.user._id,
      status: 'pending',
      startDate: req.body.startDate,
      endDate: req.body.endDate
    });

    // Do NOT change the room's status - the room remains available
    // The assignment status handles the pending request

    const populatedAssignment = await RoomAssignment.findById(assignment._id)
      .populate('room', 'number floor type')
      .populate('requestedBy', 'name email');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get available rooms
// @route   GET /api/rooms/available
// @access  Private
export const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'available' });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get room status and history for a tenant
// @route   GET /api/rooms/my-room
// @access  Private (Tenant only)
export const getMyRoom = async (req, res) => {
  try {
    const RoomAssignment = mongoose.model('RoomAssignment');
    const assignments = await RoomAssignment.find({
      requestedBy: req.user._id
    })
    .populate('room')
    .sort({ createdAt: -1 });

    const currentAssignment = assignments.find(a => 
      ['pending', 'approved', 'active'].includes(a.status)
    );

    res.json({
      currentAssignment,
      history: assignments.filter(a => 
        !['pending', 'approved', 'active'].includes(a.status)
      )
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
