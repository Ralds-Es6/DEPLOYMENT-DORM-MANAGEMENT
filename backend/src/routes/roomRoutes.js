import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  requestRoom,
  getAvailableRooms,
  getMyRoom,
  getPublicRooms
} from '../controllers/roomController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadRoomImages } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public route for browsing rooms (no auth required)
router.get('/public', getPublicRooms);
router.get('/public/available', getAvailableRooms);

// Public routes - both regular users and admins can access (auth required)
router.get('/', protect, getRooms);
router.get('/available', protect, getAvailableRooms);
router.get('/:id', protect, getRoomById);

// User routes - any authenticated user can access
router.get('/my-room', protect, getMyRoom);
router.post('/:id/request', protect, requestRoom);

// Admin only routes
router.post('/', protect, admin, uploadRoomImages.array('images', 5), createRoom);
router.put('/:id', protect, admin, uploadRoomImages.array('images', 5), updateRoom);
router.delete('/:id', protect, admin, deleteRoom);

export default router;