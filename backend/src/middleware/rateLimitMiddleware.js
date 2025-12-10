import rateLimit from 'express-rate-limit';

// Rate limiter for email verification attempts (5 attempts per 5 minutes)
export const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts
  message: 'Too many verification attempts. Please try again later.',
  statusCode: 429,
  keyGenerator: (req, res) => {
    // Limit by userId
    return `verify-${req.body.userId || 'unknown'}`;
  }
});

// Rate limiter for password reset verification (5 attempts per 5 minutes)
export const passwordResetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts
  message: 'Too many password reset attempts. Please try again later.',
  statusCode: 429,
  keyGenerator: (req, res) => {
    // Limit by userId
    return `${req.body.userId || 'unknown'}`;
  }
});

// Rate limiter for requesting verification codes (5 requests per 5 minutes)
export const requestVerificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests
  message: 'Too many verification requests. Please try again later.',
  statusCode: 429,
  keyGenerator: (req, res) => {
    // Limit by email
    return `${req.body.email || 'unknown'}`;
  }
});

// Rate limiter for requesting password reset codes (5 requests per 5 minutes)
export const requestPasswordResetLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 requests
  message: 'Too many password reset requests. Please try again later.',
  statusCode: 429,
  keyGenerator: (req, res) => {
    // Limit by email
    return `${req.body.email || 'unknown'}`;
  }
});
