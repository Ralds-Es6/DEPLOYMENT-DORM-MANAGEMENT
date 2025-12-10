import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin only routes
router.get('/stats', protect, admin, getDashboardStats);

export default router;

