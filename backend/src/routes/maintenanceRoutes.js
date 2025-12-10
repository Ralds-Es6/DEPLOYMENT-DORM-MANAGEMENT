import express from 'express';
import {
  createMaintenanceRequest,
  getMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest
} from '../controllers/maintenanceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Routes for authenticated users
router.post('/', protect, createMaintenanceRequest);

// Routes accessible by all authenticated users
router.get('/', protect, getMaintenanceRequests);
router.get('/:id', protect, getMaintenanceRequestById);

// Admin only routes
router.put('/:id', protect, admin, updateMaintenanceRequest);
router.delete('/:id', protect, admin, deleteMaintenanceRequest);

export default router;