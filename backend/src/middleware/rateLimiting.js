// src/middleware/rateLimiting.js
const rateLimit = require('express-rate-limit');
const { loginAttemptTracker } = require('../utils/loginAttempts');
const { AppError } = require('./errorHandler');

// Enhanced login rate limiting with attempt tracking
const rateLimitLogin = async (req, res, next) => {
  try {
    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Check both email and IP for rate limiting
    const emailKey = `login:email:${email}`;
    const ipKey = `login:ip:${clientIP}`;
    
    // Check if email is blocked
    if (email) {
      const emailBlocked = await loginAttemptTracker.isBlocked(emailKey, 5, 900);
      if (emailBlocked) {
        const remainingTime = await loginAttemptTracker.getRemainingBlockTime(emailKey, 5, 900);
        return next(new AppError(`Too many login attempts for this email. Try again in ${Math.ceil(remainingTime / 60)} minutes.`, 429));
      }
    }
    
    // Check if IP is blocked
    const ipBlocked = await loginAttemptTracker.isBlocked(ipKey, 10, 600);
    if (ipBlocked) {
      const remainingTime = await loginAttemptTracker.getRemainingBlockTime(ipKey, 10, 600);
      return next(new AppError(`Too many login attempts from this IP. Try again in ${Math.ceil(remainingTime / 60)} minutes.`, 429));
    }
    
    // Store identifiers for use in login controller
    req.loginIdentifiers = { emailKey, ipKey };
    
    next();
  } catch (error) {
    console.error('Rate limiting error:', error);
    next();
  }
};

module.exports = {
  rateLimitLogin
};
