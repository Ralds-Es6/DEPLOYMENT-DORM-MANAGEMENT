import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  createAdmin,
  getUsers,
  updateUserStatus,
  getPendingApprovals,
  blockUser,
  unblockUser,
  deleteUser,
  requestVerification,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  verifyPasswordResetCode,
  verifyPasswordReset,
  resendPasswordResetCode,
  getAllAdmins,
  createAdminNoVerify,
  updateAdmin,
  deleteAdmin
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  verificationLimiter,
  passwordResetLimiter,
  requestVerificationLimiter,
  requestPasswordResetLimiter
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

// Authentication routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createAdmin);

// Email verification routes
router.post('/request-verification', requestVerificationLimiter, requestVerification);
router.post('/verify-email', verificationLimiter, verifyEmail);
router.post('/resend-verification', resendVerificationCode);

// Password reset routes
router.post('/request-password-reset', requestPasswordResetLimiter, requestPasswordReset);
router.post('/verify-password-reset-code', passwordResetLimiter, verifyPasswordResetCode);
router.post('/verify-password-reset', verifyPasswordReset);
router.post('/resend-password-reset', resendPasswordResetCode);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.get('/', protect, admin, getUsers);
router.get('/pending-approvals', protect, admin, getPendingApprovals);
router.get('/admins/all', protect, admin, getAllAdmins);
router.put('/:id/status', protect, admin, updateUserStatus);
router.put('/:id/block', protect, admin, blockUser);
router.put('/:id/unblock', protect, admin, unblockUser);
router.delete('/:id', protect, admin, deleteUser);

// Admin management routes (Super Admin only)
router.post('/admin/create-no-verify', protect, admin, createAdminNoVerify);
router.put('/admin/:id', protect, admin, updateAdmin);
router.delete('/admin/:id', protect, admin, deleteAdmin);

export default router;