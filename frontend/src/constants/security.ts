// src/constants/security.ts
export const SECURITY_CONSTANTS = {
    // Password requirements
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    MAX_EMAIL_LENGTH: 254,
    
    // Rate limiting
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    LOGIN_BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
    
    // CAPTCHA
    CAPTCHA_THRESHOLD: 3,
    
    // Session
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
  
    // Common weak passwords
    WEAK_PASSWORDS: [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'football', 'baseball',
      'trustno1', 'superman', 'batman', 'jordan', 'harley'
    ],
  } as const;