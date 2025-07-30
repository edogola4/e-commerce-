// src/utils/recaptcha.js
const axios = require('axios');

/**
 * reCAPTCHA verification utility for your authentication system
 */
class RecaptchaVerifier {
  constructor() {
    this.secretKey = process.env.RECAPTCHA_SECRET_KEY;
    this.verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    this.minScore = parseFloat(process.env.RECAPTCHA_MIN_SCORE || '0.5');
    this.timeout = parseInt(process.env.RECAPTCHA_TIMEOUT || '5000');
  }

  /**
   * Verify reCAPTCHA token
   * @param {string} token - reCAPTCHA response token
   * @param {string} remoteip - User's IP address
   * @returns {Promise<Object>} Verification result
   */
  async verify(token, remoteip = null) {
    if (!token || typeof token !== 'string') {
      return {
        success: false,
        error: 'Invalid or missing reCAPTCHA token',
        code: 'MISSING_TOKEN'
      };
    }

    if (!this.secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      return {
        success: false,
        error: 'reCAPTCHA not configured',
        code: 'MISSING_SECRET'
      };
    }

    try {
      const params = new URLSearchParams({
        secret: this.secretKey,
        response: token
      });

      if (remoteip) {
        params.append('remoteip', remoteip);
      }

      const response = await axios.post(this.verificationUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: this.timeout
      });

      const data = response.data;

      if (!data.success) {
        return {
          success: false,
          error: this.getErrorMessage(data['error-codes']),
          errorCodes: data['error-codes'],
          code: 'VERIFICATION_FAILED'
        };
      }

      // Check score for v3 reCAPTCHA
      if (data.score !== undefined && data.score < this.minScore) {
        return {
          success: false,
          error: `reCAPTCHA score too low: ${data.score}`,
          score: data.score,
          code: 'LOW_SCORE'
        };
      }

      return {
        success: true,
        score: data.score,
        action: data.action,
        challenge_ts: data.challenge_ts,
        hostname: data.hostname
      };

    } catch (error) {
      console.error('reCAPTCHA verification error:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'reCAPTCHA verification timeout',
          code: 'TIMEOUT'
        };
      }

      return {
        success: false,
        error: 'reCAPTCHA verification service unavailable',
        code: 'SERVICE_ERROR'
      };
    }
  }

  /**
   * Convert Google error codes to readable messages
   */
  getErrorMessage(errorCodes) {
    if (!errorCodes || !Array.isArray(errorCodes)) {
      return 'Unknown reCAPTCHA error';
    }

    const errorMessages = {
      'missing-input-secret': 'Missing secret key',
      'invalid-input-secret': 'Invalid secret key',
      'missing-input-response': 'Missing reCAPTCHA response',
      'invalid-input-response': 'Invalid reCAPTCHA response',
      'bad-request': 'Bad request',
      'timeout-or-duplicate': 'Response expired or already used'
    };

    return errorCodes.map(code => errorMessages[code] || `Unknown error: ${code}`).join(', ');
  }
}

// Create singleton instance
const recaptchaVerifier = new RecaptchaVerifier();

module.exports = {
  RecaptchaVerifier,
  verifyRecaptcha: (token, remoteip) => recaptchaVerifier.verify(token, remoteip)
};

// src/middleware/recaptcha.js
const { verifyRecaptcha } = require('../utils/recaptcha');

/**
 * Middleware to verify reCAPTCHA token
 * @param {Object} options - Configuration options
 */
const validateRecaptcha = (options = {}) => {
  const {
    required = false,
    skipForDevelopment = true
  } = options;

  return async (req, res, next) => {
    try {
      const { captchaToken } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

      // Skip in development if configured
      if (skipForDevelopment && process.env.NODE_ENV === 'development' && !captchaToken) {
        req.recaptcha = { verified: false, skipped: true };
        return next();
      }

      // Handle missing token
      if (!captchaToken) {
        if (required) {
          return res.status(400).json({
            success: false,
            message: 'reCAPTCHA verification required',
            field: 'captchaToken'
          });
        }
        
        req.recaptcha = { verified: false, optional: true };
        return next();
      }

      // Verify the token
      const result = await verifyRecaptcha(captchaToken, clientIP);

      if (result.success) {
        req.recaptcha = {
          verified: true,
          score: result.score,
          action: result.action,
          hostname: result.hostname
        };
        next();
      } else {
        req.recaptcha = {
          verified: false,
          error: result.error,
          code: result.code
        };

        if (required) {
          return res.status(400).json({
            success: false,
            message: 'reCAPTCHA verification failed',
            error: result.error,
            field: 'captchaToken'
          });
        }
        
        next();
      }
    } catch (error) {
      console.error('reCAPTCHA middleware error:', error);
      req.recaptcha = {
        verified: false,
        error: 'Verification service error'
      };
      
      if (required) {
        return res.status(500).json({
          success: false,
          message: 'reCAPTCHA verification service error'
        });
      }
      
      next();
    }
  };
};

module.exports = {
  validateRecaptcha,
  requireRecaptcha: validateRecaptcha({ required: true }),
  optionalRecaptcha: validateRecaptcha({ required: false })
};

// src/utils/loginAttempts.js
/**
 * Simple in-memory failed login attempt tracker
 * In production, use Redis or database storage
 */
class LoginAttemptTracker {
  constructor() {
    this.attempts = new Map();
    this.maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    this.lockoutDuration = parseInt(process.env.LOCKOUT_DURATION || '1800000'); // 30 minutes
    this.attemptWindow = parseInt(process.env.ATTEMPT_WINDOW || '900000'); // 15 minutes
  }

  /**
   * Get identifier for tracking attempts
   */
  getIdentifier(email, ip) {
    return `${email.toLowerCase()}_${ip}`;
  }

  /**
   * Get current failed attempts for identifier
   */
  getAttempts(email, ip) {
    const identifier = this.getIdentifier(email, ip);
    const data = this.attempts.get(identifier);
    
    if (!data) return 0;
    
    // Check if attempts are within the time window
    if (Date.now() - data.firstAttempt > this.attemptWindow) {
      this.attempts.delete(identifier);
      return 0;
    }
    
    return data.count;
  }

  /**
   * Check if account is locked
   */
  isLocked(email, ip) {
    const identifier = this.getIdentifier(email, ip);
    const data = this.attempts.get(identifier);
    
    if (!data || !data.lockedUntil) return false;
    
    if (Date.now() > data.lockedUntil) {
      // Lock expired, clean up
      this.attempts.delete(identifier);
      return false;
    }
    
    return true;
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(email, ip) {
    const identifier = this.getIdentifier(email, ip);
    const now = Date.now();
    let data = this.attempts.get(identifier);
    
    if (!data || now - data.firstAttempt > this.attemptWindow) {
      // New attempt series
      data = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      };
    } else {
      // Increment existing attempts
      data.count += 1;
      data.lastAttempt = now;
    }
    
    // Lock account if max attempts reached
    if (data.count >= this.maxAttempts) {
      data.lockedUntil = now + this.lockoutDuration;
    }
    
    this.attempts.set(identifier, data);
    return data;
  }

  /**
   * Clear failed attempts (on successful login)
   */
  clearAttempts(email, ip) {
    const identifier = this.getIdentifier(email, ip);
    this.attempts.delete(identifier);
  }

  /**
   * Get time until unlock
   */
  getTimeUntilUnlock(email, ip) {
    const identifier = this.getIdentifier(email, ip);
    const data = this.attempts.get(identifier);
    
    if (!data || !data.lockedUntil) return 0;
    
    const remaining = data.lockedUntil - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Check if reCAPTCHA should be required
   */
  requiresCaptcha(email, ip) {
    const attempts = this.getAttempts(email, ip);
    const captchaThreshold = parseInt(process.env.CAPTCHA_THRESHOLD || '3');
    return attempts >= captchaThreshold;
  }
}

// Create singleton instance
const loginAttemptTracker = new LoginAttemptTracker();

module.exports = {
  LoginAttemptTracker,
  loginAttemptTracker
};

// src/middleware/rateLimiting.js
const { loginAttemptTracker } = require('../utils/loginAttempts');

/**
 * Rate limiting middleware for login attempts
 */
const rateLimitLogin = (req, res, next) => {
  const { email } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  if (!email) {
    return next(); // Let validation middleware handle missing email
  }

  // Check if account is locked
  if (loginAttemptTracker.isLocked(email, clientIP)) {
    const timeUntilUnlock = loginAttemptTracker.getTimeUntilUnlock(email, clientIP);
    const minutesRemaining = Math.ceil(timeUntilUnlock / 60000);
    
    return res.status(429).json({
      success: false,
      message: `Account temporarily locked due to too many failed attempts. Please try again in ${minutesRemaining} minutes.`,
      locked: true,
      timeUntilUnlock: timeUntilUnlock,
      retryAfter: new Date(Date.now() + timeUntilUnlock).toISOString()
    });
  }

  // Check if captcha is required
  const requiresCaptcha = loginAttemptTracker.requiresCaptcha(email, clientIP);
  const attempts = loginAttemptTracker.getAttempts(email, clientIP);
  
  // Add attempt info to request
  req.loginAttempts = {
    count: attempts,
    requiresCaptcha,
    maxAttempts: loginAttemptTracker.maxAttempts
  };

  next();
};

module.exports = {
  rateLimitLogin
};