// frontend/src/types/profile.ts
export interface UserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    isEmailVerified: boolean;
    avatar?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    orders: Order[];
    wishlist: WishlistItem[];
    addresses: Address[];
    preferences: UserPreferences;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    status: 'active' | 'inactive' | 'suspended';
    role: 'customer' | 'admin' | 'moderator';
    twoFactorEnabled: boolean;
  }
  
  export interface Order {
    id: string;
    orderNumber: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    total: number;
    currency: string;
    items: OrderItem[];
    shippingAddress: Address;
    billingAddress: Address;
    createdAt: string;
    updatedAt: string;
    deliveredAt?: string;
    trackingNumber?: string;
  }
  
  export interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    total: number;
    sku: string;
    variant?: ProductVariant;
  }
  
  export interface ProductVariant {
    size?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  }
  
  export interface WishlistItem {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    currency: string;
    isInStock: boolean;
    addedAt: string;
    variant?: ProductVariant;
  }
  
  export interface Address {
    id: string;
    type: 'shipping' | 'billing';
    isDefault: boolean;
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
    instructions?: string;
  }
  
  export interface UserPreferences {
    notifications: NotificationPreferences;
    privacy: PrivacyPreferences;
    communication: CommunicationPreferences;
  }
  
  export interface NotificationPreferences {
    email: {
      orderUpdates: boolean;
      promotions: boolean;
      newsletter: boolean;
      securityAlerts: boolean;
      wishlistAlerts: boolean;
    };
    sms: {
      orderUpdates: boolean;
      securityAlerts: boolean;
    };
    push: {
      orderUpdates: boolean;
      promotions: boolean;
      restockAlerts: boolean;
    };
  }
  
  export interface PrivacyPreferences {
    profileVisibility: 'public' | 'private';
    dataSharing: boolean;
    analytics: boolean;
    personalization: boolean;
  }
  
  export interface CommunicationPreferences {
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  }
  
  // frontend/src/utils/profile.ts
  import { UserProfile } from '@/types/profile';
  
  /**
   * Sanitizes user input to prevent XSS attacks
   */
  export const sanitizeInput = (input: string): string => {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  };
  
  /**
   * Validates email format
   */
  export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validates phone number format (basic validation)
   */
  export const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };
  
  /**
   * Formats currency values
   */
  export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch (error) {
      console.warn('Error formatting currency:', error);
      return `${currency} ${amount.toFixed(2)}`;
    }
  };
  
  /**
   * Formats dates with proper localization
   */
  export const formatDate = (
    date: string | Date, 
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      }).format(dateObj);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  /**
   * Gets relative time (e.g., "2 days ago")
   */
  export const getRelativeTime = (date: string | Date): string => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      console.warn('Error calculating relative time:', error);
      return 'Unknown';
    }
  };
  
  /**
   * Generates user display name with fallbacks
   */
  export const getUserDisplayName = (user: UserProfile | null): string => {
    if (!user) return 'User';
    
    try {
      if (user.firstName || user.lastName) {
        const firstName = sanitizeInput(user.firstName || '');
        const lastName = sanitizeInput(user.lastName || '');
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || 'User';
      }
      
      if (user.name) {
        return sanitizeInput(user.name) || 'User';
      }
      
      if (user.email) {
        const emailPrefix = user.email.split('@')[0];
        return sanitizeInput(emailPrefix) || 'User';
      }
      
      return 'User';
    } catch (error) {
      console.warn('Error getting display name:', error);
      return 'User';
    }
  };
  
  /**
   * Generates user initials for avatar
   */
  export const getUserInitials = (user: UserProfile | null): string => {
    if (!user) return 'U';
    
    try {
      if (user.firstName || user.lastName) {
        const first = (user.firstName || '').charAt(0).toUpperCase();
        const last = (user.lastName || '').charAt(0).toUpperCase();
        return (first + last) || first || last || 'U';
      }
      
      if (user.name) {
        const nameParts = user.name.trim().split(' ');
        if (nameParts.length >= 2) {
          return nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
        }
        return user.name.charAt(0).toUpperCase();
      }
      
      return user.email ? user.email.charAt(0).toUpperCase() : 'U';
    } catch (error) {
      console.warn('Error getting initials:', error);
      return 'U';
    }
  };
  
  /**
   * Calculates user account age
   */
  export const getAccountAge = (createdAt: string): string => {
    try {
      const created = new Date(createdAt);
      const now = new Date();
      const diffYears = now.getFullYear() - created.getFullYear();
      
      if (diffYears > 0) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
      }
      
      const diffMonths = 
        (now.getFullYear() - created.getFullYear()) * 12 + 
        (now.getMonth() - created.getMonth());
      
      if (diffMonths > 0) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
      }
      
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } catch (error) {
      console.warn('Error calculating account age:', error);
      return 'Unknown';
    }
  };
  
  /**
   * Validates user profile data
   */
  export const validateUserProfile = (data: Partial<UserProfile>): string[] => {
    const errors: string[] = [];
    
    if (data.email && !isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (data.phone && !isValidPhone(data.phone)) {
      errors.push('Please enter a valid phone number');
    }
    
    if (data.firstName && data.firstName.length < 2) {
      errors.push('First name must be at least 2 characters long');
    }
    
    if (data.lastName && data.lastName.length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }
    
    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13) {
        errors.push('You must be at least 13 years old to create an account');
      }
      
      if (age > 120) {
        errors.push('Please enter a valid birth date');
      }
    }
    
    return errors;
  };
  
  /**
   * Generates color for user avatar based on user ID
   */
  export const getAvatarColor = (userId: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    const hash = userId.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // frontend/src/constants/profile.ts
  export const PROFILE_CONSTANTS = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 50,
    MAX_ADDRESS_LENGTH: 100,
    MAX_PHONE_LENGTH: 20,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  } as const;
  
  export const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'AU', name: 'Australia' },
    // Add more countries as needed
  ] as const;
  
  export const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  ] as const;
  
  export const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
  ] as const;