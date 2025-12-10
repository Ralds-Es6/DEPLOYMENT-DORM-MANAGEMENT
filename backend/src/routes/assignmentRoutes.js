import express from 'express';
import {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getPendingAssignments,
  checkoutAssignment,
  getPrintTransactions
} from '../controllers/roomAssignmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadIdImage } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Routes accessible by all authenticated users
router.get('/', protect, getAssignments);
router.post('/', protect, uploadIdImage.single('idImage'), createAssignment);
router.put('/:id/checkout', protect, checkoutAssignment);

// Admin only routes - IMPORTANT: Specific routes MUST come before :id routes
router.get('/pending', protect, admin, getPendingAssignments);
router.get('/print/transactions', protect, admin, getPrintTransactions);
router.get('/:id', protect, admin, getAssignmentById);
router.put('/:id', protect, admin, updateAssignment);
router.delete('/:id', protect, admin, deleteAssignment);

export default router;