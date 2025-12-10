import express from 'express';
import {
  submitReport,
  getUserReports,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport
} from '../controllers/reportController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// User routes
router.post('/', protect, submitReport);
router.get('/my-reports', protect, getUserReports);

// Admin routes
router.get('/', protect, admin, getAllReports);
router.get('/:id', protect, getReportById);
router.put('/:id', protect, admin, updateReport);
router.delete('/:id', protect, admin, deleteReport);

export default router;
