// src/utils/auth.ts
import { SECURITY_CONSTANTS } from '@/constants/security';

export interface SecurityEvent {
  type: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, '');
};

export const validateLoginForm = {
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= SECURITY_CONSTANTS.MAX_EMAIL_LENGTH;
  },
  password: (password: string): boolean => {
    return password.length >= SECURITY_CONSTANTS.MIN_PASSWORD_LENGTH && 
           password.length <= SECURITY_CONSTANTS.MAX_PASSWORD_LENGTH;
  }
};

export const trackSecurityEvent = (event: SecurityEvent): void => {
  const eventData = {
    ...event,
    timestamp: event.timestamp || new Date(),
  };
  
  console.log('Security Event:', eventData);
  
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
};

export const encryptForStorage = (data: any, key: string): string => {
  try {
    return btoa(JSON.stringify(data) + key);
  } catch (error) {
    console.warn('Encryption failed:', error);
    return '';
  }
};

export const decryptFromStorage = (encryptedData: string, key: string): any => {
  try {
    const decrypted = atob(encryptedData);
    const jsonString = decrypted.replace(key, '');
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Decryption failed:', error);
    return null;
  }
};

export const validateRedirectUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;
    return urlObj.origin === currentOrigin;
  } catch {
    return false;
  }
};