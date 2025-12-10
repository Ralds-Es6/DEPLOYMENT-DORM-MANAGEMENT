import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
});

export const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized as admin' });
};

export const checkUserAccess = (req, res, next) => {
  if (
    req.user && (
      req.user.isAdmin || 
      req.user.role === 'admin' || 
      req.user.id === req.params.userId
    )
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized to access this resource' });
};