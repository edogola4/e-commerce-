// frontend/src/types/auth.ts (extend your existing types)
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
    captchaToken?: string;
    deviceInfo?: DeviceInfo;
  }
  
  export interface RegisterCredentials {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    agreeToTerms: boolean;
    marketingConsent?: boolean;
    captchaToken?: string;
  }
  
  export interface DeviceInfo {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
    screenResolution?: string;
    cookieEnabled?: boolean;
  }
  
  export interface SecurityEvent {
    type: SecurityEventType;
    timestamp?: Date;
    metadata?: Record<string, any>;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }
  
  export type SecurityEventType = 
    | 'login_attempt'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'password_change'
    | 'registration_attempt'
    | 'suspicious_activity'
    | 'demo_login_attempt'
    | 'session_expired';
  
  // Enhanced User interface (extend your existing User type)
  export interface EnhancedUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: UserRole;
    isEmailVerified: boolean;
    twoFactorEnabled?: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
  }
  
  export type UserRole = 'customer' | 'admin' | 'moderator' | 'support';
  
  // Utility functions
  export const sanitizeInput = (input: string): string => {
    if (!input) return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  };
  
  export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  };
  
  export const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 128;
  };
  
  export const isWeakPassword = (password: string): boolean => {
    const weakPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return weakPasswords.includes(password.toLowerCase());
  };
  
  export const getPasswordStrength = (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Include special characters');
    
    return { score, feedback };
  };
  
  export const generateDeviceFingerprint = (): string => {
    if (typeof window === 'undefined') return 'server';
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.cookieEnabled
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  };
  
  export const trackSecurityEvent = (event: SecurityEvent): void => {
    const eventData = {
      ...event,
      timestamp: event.timestamp || new Date(),
      deviceFingerprint: generateDeviceFingerprint(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Event:', eventData);
    }
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'security_event', {
        event_category: 'security',
        event_label: event.type,
        custom_parameters: {
          severity: event.severity || 'medium',
          ...event.metadata
        }
      });
    }
    
    // Send to monitoring service in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }).catch(error => {
        console.warn('Failed to log security event:', error);
      });
    }
  };
  
  // Rate limiting utility class
  export class RateLimiter {
    private attempts: Map<string, { count: number; firstAttempt: number; blocked: boolean; blockedUntil?: number }> = new Map();
    
    constructor(
      private maxAttempts: number = 5,
      private windowMs: number = 15 * 60 * 1000, // 15 minutes
      private blockDurationMs: number = 30 * 60 * 1000 // 30 minutes
    ) {}
    
    checkAttempt(identifier: string): { allowed: boolean; attemptsLeft: number; blockedUntil?: Date } {
      const now = Date.now();
      const record = this.attempts.get(identifier);
      
      if (!record) {
        this.attempts.set(identifier, { count: 1, firstAttempt: now, blocked: false });
        return { allowed: true, attemptsLeft: this.maxAttempts - 1 };
      }
      
      // Check if block period has expired
      if (record.blocked && record.blockedUntil && now > record.blockedUntil) {
        this.attempts.delete(identifier);
        return this.checkAttempt(identifier);
      }
      
      // If currently blocked
      if (record.blocked && record.blockedUntil) {
        return { 
          allowed: false, 
          attemptsLeft: 0, 
          blockedUntil: new Date(record.blockedUntil) 
        };
      }
      
      // Check if window has expired
      if (now - record.firstAttempt > this.windowMs) {
        this.attempts.set(identifier, { count: 1, firstAttempt: now, blocked: false });
        return { allowed: true, attemptsLeft: this.maxAttempts - 1 };
      }
      
      // Increment attempts
      record.count++;
      
      // Check if max attempts exceeded
      if (record.count > this.maxAttempts) {
        record.blocked = true;
        record.blockedUntil = now + this.blockDurationMs;
        
        return { 
          allowed: false, 
          attemptsLeft: 0, 
          blockedUntil: new Date(record.blockedUntil) 
        };
      }
      
      return { 
        allowed: true, 
        attemptsLeft: this.maxAttempts - record.count 
      };
    }
    
    reset(identifier: string): void {
      this.attempts.delete(identifier);
    }
    
    getAttempts(identifier: string): number {
      return this.attempts.get(identifier)?.count || 0;
    }
  }
  
  // Security constants
  export const SECURITY_CONSTANTS = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MAX_EMAIL_LENGTH: 254,
    MAX_LOGIN_ATTEMPTS: 5,
    LOGIN_RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    LOGIN_BLOCK_DURATION: 30 * 60 * 1000, // 30 minutes
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
    WEAK_PASSWORDS: [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      'dragon', 'master', 'shadow', 'football', 'baseball'
    ]
  } as const;