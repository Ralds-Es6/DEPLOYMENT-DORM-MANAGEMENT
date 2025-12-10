import User from '../models/User.js';
import RoomAssignment from '../models/RoomAssignment.js';
import Room from '../models/Room.js';
import jwt from 'jsonwebtoken';
import { generateVerificationCode, sendVerificationEmail, sendAccountCreatedEmail, sendPasswordResetEmail } from '../utils/emailService.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Request email verification (Send verification code)
// @route   POST /api/users/request-verification
// @access  Public
export const requestVerification = async (req, res) => {
  try {
    const { name, email, password, mobileNumber } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes (reduced from 10)

    // Store temporary registration data (NOT in User collection yet)
    // Using a temporary document to hold data until verification completes
    const tempUser = await User.create({
      name,
      email,
      password,
      mobileNumber,
      role: 'tenant',
      status: 'pending',
      isAdmin: false,
      isEmailVerified: false,
      verificationCode,
      verificationCodeExpires,
      isTemporary: true  // Mark as temporary - not yet verified
    });

    // Send verification email using system Gmail account
    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({
      message: 'Verification code sent to your email. Please verify to complete registration.',
      email,
      userId: tempUser._id,
      requiresVerification: true
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Verify email with verification code
// @route   POST /api/users/verify-email
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const { userId, verificationCode } = req.body;

    if (!userId || !verificationCode) {
      res.status(400);
      throw new Error('Please provide user ID and verification code');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check if already verified
    if (user.isEmailVerified) {
      res.status(400);
      throw new Error('Email already verified');
    }

    // Check if code has expired - DELETE temporary account if expired
    if (new Date() > user.verificationCodeExpires) {
      await User.findByIdAndDelete(userId);  // Delete expired temporary account immediately
      res.status(400);
      throw new Error('Verification code has expired. Please request a new one.');
    }

    // Check verification code - Do NOT delete on single invalid code
    if (user.verificationCode !== verificationCode) {
      res.status(400);
      throw new Error('Invalid verification code. Please try again or request a new code.');
    }

    // Mark email as verified and account as permanent
    user.isEmailVerified = true;
    user.isTemporary = false;  // Now the account is valid/permanent
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.status = 'pending';  // Keep as pending until admin approves
    await user.save();

    // Send account created email using system Gmail account
    await sendAccountCreatedEmail(user.email, user.name);

    res.status(200).json({
      message: 'Email verified successfully. Account created!',
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Resend verification code
// @route   POST /api/users/resend-verification
// @access  Public
export const resendVerificationCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error('Please provide user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      res.status(400);
      throw new Error('Email already verified');
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    // Send verification email using system Gmail account
    await sendVerificationEmail(user.email, verificationCode);

    res.status(200).json({
      message: 'New verification code sent to your email',
      email: user.email
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Register a new user (Direct registration - for backward compatibility)
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'tenant',
      status: 'pending',
      isAdmin: false,
      isEmailVerified: false
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Check if user is blocked
      if (user.isBlocked) {
        res.status(403);
        throw new Error('User has been blocked by the admin');
      }

      res.json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        status: user.status,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Create initial admin user (only works when no admin exists)
// @route   POST /api/users/create-admin
// @access  Public
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminCode } = req.body;

    if (!name || !email || !password || !adminCode) {
      res.status(400);
      throw new Error('Please provide all required fields');
    }

    // Verify admin creation code (should match environment variable)
    if (adminCode !== process.env.ADMIN_CREATION_CODE) {
      res.status(401);
      throw new Error('Invalid admin creation code');
    }

    // Check if any admin already exists
    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      res.status(400);
      throw new Error('An admin user already exists');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin: true, // This will be an admin user
      isSuperAdmin: true // First admin is automatically super admin
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Update user's approval status
// @route   PUT /api/users/:id/status
// @access  Private/Admin
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      res.status(400);
      throw new Error('Invalid status value');
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot modify admin status');
    }

    user.status = status;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get pending tenant approvals
// @route   GET /api/users/pending-approvals
// @access  Private/Admin
export const getPendingApprovals = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: 'tenant',
      status: 'pending'
    }).select('-password');
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Block a user
// @route   PUT /api/users/:id/block
// @access  Private/Admin
export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot block an admin user');
    }

    user.isBlocked = true;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      message: 'User has been blocked successfully'
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Unblock a user
// @route   PUT /api/users/:id/unblock
// @access  Private/Admin
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot unblock an admin user');
    }

    user.isBlocked = false;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      message: 'User has been unblocked successfully'
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isAdmin) {
      res.status(400);
      throw new Error('Cannot delete an admin user');
    }

    // Find all active check-in records for this user
    const assignments = await RoomAssignment.find({
      requestedBy: req.params.id,
      status: { $in: ['approved', 'active'] }
    });

    // Update occupancy for each room
    for (const assignment of assignments) {
      const room = await Room.findById(assignment.room);
      if (room && room.occupied > 0) {
        room.occupied -= 1;
        
        // Update room status if it becomes empty
        if (room.occupied === 0) {
          room.status = 'available';
        }
        
        await room.save();
      }
    }

    // Delete all check-in records for this user
    await RoomAssignment.deleteMany({ requestedBy: req.params.id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User has been deleted successfully',
      _id: user._id,
      email: user.email,
      deletedAssignments: assignments.length
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Clean up expired temporary registrations
// @route   Helper function (called internally)
// @access  Internal
export const cleanupExpiredRegistrations = async () => {
  try {
    // Delete temporary accounts where verification code has expired
    const result = await User.deleteMany({
      isTemporary: true,
      verificationCodeExpires: { $lt: new Date() }
    });
    if (result.deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${result.deletedCount} expired temporary registrations`);
    }
  } catch (error) {
    console.error('[Cleanup Error] Failed to clean up expired registrations:', error.message);
  }
};

// @desc    Request password reset (Send reset code to email)
// @route   POST /api/users/request-password-reset
// @access  Public
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please provide your email address');
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404);
      throw new Error('Account not found with this email. Please check and try again.');
    }

    // Check if account is verified (not temporary)
    if (user.isTemporary || !user.isEmailVerified) {
      res.status(400);
      throw new Error('Please verify your email first before resetting password');
    }

    // Generate password reset code
    const resetCode = generateVerificationCode();
    const passwordResetCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store reset code on user
    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpires = passwordResetCodeExpires;
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, resetCode);

    res.status(200).json({
      message: 'Password reset code sent to your email. Check your inbox.',
      email,
      userId: user._id,
      requiresPasswordReset: true
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Verify reset code only (without password change)
// @route   POST /api/users/verify-password-reset-code
// @access  Public
export const verifyPasswordResetCode = async (req, res) => {
  try {
    const { userId, resetCode } = req.body;

    if (!userId || !resetCode) {
      res.status(400);
      throw new Error('Please provide user ID and reset code');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check reset code
    if (user.passwordResetCode !== resetCode) {
      // Clear invalid reset code immediately (security measure)
      user.passwordResetCode = null;
      user.passwordResetCodeExpires = null;
      await user.save();
      
      res.status(400);
      throw new Error('Invalid reset code');
    }

    // Check if code has expired
    if (new Date() > user.passwordResetCodeExpires) {
      // Clear expired reset code
      user.passwordResetCode = null;
      user.passwordResetCodeExpires = null;
      await user.save();
      
      res.status(400);
      throw new Error('Reset code has expired. Please request a new one.');
    }

    res.status(200).json({
      message: 'Reset code verified successfully. You can now set a new password.',
      verified: true
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Verify reset code and update password
// @route   POST /api/users/verify-password-reset
// @access  Public
export const verifyPasswordReset = async (req, res) => {
  try {
    const { userId, resetCode, newPassword } = req.body;

    if (!userId || !resetCode || !newPassword) {
      res.status(400);
      throw new Error('Please provide user ID, reset code, and new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Check reset code
    if (user.passwordResetCode !== resetCode) {
      // Clear invalid reset code immediately (security measure)
      user.passwordResetCode = null;
      user.passwordResetCodeExpires = null;
      await user.save();
      
      res.status(400);
      throw new Error('Invalid reset code');
    }

    // Check if code has expired
    if (new Date() > user.passwordResetCodeExpires) {
      // Clear expired reset code
      user.passwordResetCode = null;
      user.passwordResetCodeExpires = null;
      await user.save();
      
      res.status(400);
      throw new Error('Reset code has expired. Please request a new one.');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetCode = null;
    user.passwordResetCodeExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully! You can now log in with your new password.',
      email: user.email
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Resend password reset code
// @route   POST /api/users/resend-password-reset
// @access  Public
export const resendPasswordResetCode = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400);
      throw new Error('Please provide user ID');
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Generate new reset code
    const resetCode = generateVerificationCode();
    const passwordResetCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpires = passwordResetCodeExpires;
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, resetCode);

    res.status(200).json({
      message: 'New password reset code sent to your email',
      email: user.email
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Get all admin users
// @route   GET /api/users/admins
// @access  Private/Admin
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('-password');
    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    res.status(500);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Create new admin (Super Admin only - No email verification required)
// @route   POST /api/users/create-admin-no-verify
// @access  Private/Admin
export const createAdminNoVerify = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields: name, email, password');
    }

    // Check if requesting user is super admin
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser || !requestingUser.isSuperAdmin) {
      res.status(403);
      throw new Error('Only super admin can create new admin accounts');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('An account with this email already exists');
    }

    // Create new admin user (not super admin)
    const admin = await User.create({
      name,
      email,
      password,
      isAdmin: true,
      isSuperAdmin: false, // Regular admin, not super admin
      role: 'admin',
      status: 'approved',
      isEmailVerified: true,
      isTemporary: false
    });

    if (admin) {
      res.status(201).json({
        success: true,
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isAdmin: admin.isAdmin,
        isSuperAdmin: admin.isSuperAdmin,
        createdAt: admin.createdAt
      });
    } else {
      res.status(400);
      throw new Error('Failed to create admin account');
    }
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Update admin details
// @route   PUT /api/users/admin/:id
// @access  Private/Admin
export const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    // Check if requesting user is super admin
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser || !requestingUser.isSuperAdmin) {
      res.status(403);
      throw new Error('Only super admin can update admin accounts');
    }

    // Find the admin
    const admin = await User.findById(id);
    if (!admin || !admin.isAdmin) {
      res.status(404);
      throw new Error('Admin not found');
    }

    // Update fields if provided
    if (name) admin.name = name;
    if (email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400);
        throw new Error('Please provide a valid email address');
      }

      // Check if email is already in use by another user
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        res.status(400);
        throw new Error('Email is already in use by another account');
      }
      admin.email = email;
    }
    if (password) {
      if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
      }
      admin.password = password; // Will be hashed by the pre-save hook
    }

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        isAdmin: admin.isAdmin,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};

// @desc    Delete admin account
// @route   DELETE /api/users/admin/:id
// @access  Private/Admin
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if requesting user is super admin
    const requestingUser = await User.findById(req.user._id);
    if (!requestingUser || !requestingUser.isSuperAdmin) {
      res.status(403);
      throw new Error('Only super admin can delete admin accounts');
    }

    // Find the admin
    const admin = await User.findById(id);
    if (!admin || !admin.isAdmin) {
      res.status(404);
      throw new Error('Admin not found');
    }

    // Prevent deleting the super admin
    if (admin.isSuperAdmin) {
      res.status(400);
      throw new Error('Super admin account cannot be deleted');
    }

    // Prevent deleting the current user (optional safety measure)
    if (req.user._id.toString() === id) {
      res.status(400);
      throw new Error('You cannot delete your own admin account');
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Admin account deleted successfully'
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    res.json({
      message: error.message || 'Server Error',
      stack: process.env.NODE_ENV === 'production' ? null : error.stack,
    });
  }
};