// frontend/src/hooks/useProfile.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, Address, NotificationPreferences } from '@/types/profile';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { validateUserProfile } from '@/utils/profile';

interface UseProfileOptions {
  enableAutoSave?: boolean;
  autoSaveDelay?: number;
  enableCache?: boolean;
  cacheKey?: string;
}

interface UseProfileReturn {
  // State
  profile: UserProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDirty: boolean;
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<boolean>;
  removeAvatar: () => Promise<boolean>;
  
  // Address management
  addAddress: (address: Omit<Address, 'id'>) => Promise<boolean>;
  updateAddress: (id: string, updates: Partial<Address>) => Promise<boolean>;
  removeAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string, type: 'shipping' | 'billing') => Promise<boolean>;
  
  // Security
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  enableTwoFactor: () => Promise<{ qrCode: string; backupCodes: string[] } | null>;
  disableTwoFactor: (code: string) => Promise<boolean>;
  
  // Preferences
  updateNotificationPreferences: (preferences: NotificationPreferences) => Promise<boolean>;
  
  // Utilities
  resetChanges: () => void;
  validateProfile: () => string[];
}

export function useProfile(
  userId?: string,
  options: UseProfileOptions = {}
): UseProfileReturn {
  const {
    enableAutoSave = false,
    autoSaveDelay = 2000,
    enableCache = true,
    cacheKey = 'user-profile'
  } = options;

  const { toast } = useToast();
  
  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache management
  const getCachedProfile = useCallback((): UserProfile | null => {
    if (!enableCache || typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        const cacheAge = now - timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < maxAge) {
          return data;
        }
      }
    } catch (error) {
      console.warn('Error reading cached profile:', error);
    }
    
    return null;
  }, [enableCache, cacheKey]);

  const setCachedProfile = useCallback((profileData: UserProfile) => {
    if (!enableCache || typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data: profileData,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error caching profile:', error);
    }
  }, [enableCache, cacheKey]);

  // Computed values
  const isDirty = useMemo(() => {
    if (!profile || !originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  // Error handling
  const handleError = useCallback((error: any, operation: string) => {
    const message = error?.response?.data?.message || error?.message || `Failed to ${operation}`;
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
    console.error(`Profile ${operation} error:`, error);
  }, [toast]);

  // API operations
  const fetchProfile = useCallback(async (useCache = true): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Try cache first
      if (useCache) {
        const cached = getCachedProfile();
        if (cached) {
          setProfile(cached);
          setOriginalProfile(cached);
          setLoading(false);
          return;
        }
      }

      const response = await apiClient.get('/api/profile');
      const profileData = response.data;
      
      setProfile(profileData);
      setOriginalProfile(structuredClone(profileData));
      
      if (enableCache) {
        setCachedProfile(profileData);
      }
    } catch (error) {
      handleError(error, 'fetch profile');
    } finally {
      setLoading(false);
    }
  }, [getCachedProfile, setCachedProfile, enableCache, handleError]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;

    try {
      setSaving(true);
      setError(null);

      // Validate updates
      const errors = validateUserProfile(updates);
      if (errors.length > 0) {
        setError(errors.join(', '));
        return false;
      }

      const response = await apiClient.patch('/api/profile', updates);
      const updatedProfile = response.data;
      
      setProfile(updatedProfile);
      setOriginalProfile(structuredClone(updatedProfile));
      
      if (enableCache) {
        setCachedProfile(updatedProfile);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'update profile');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    await fetchProfile(false);
  }, [fetchProfile]);

  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed');
        return false;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/api/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { avatarUrl } = response.data;
      
      if (profile) {
        const updatedProfile = { ...profile, avatar: avatarUrl };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'upload avatar');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  const removeAvatar = useCallback(async (): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      await apiClient.delete('/api/profile/avatar');
      
      if (profile) {
        const updatedProfile = { ...profile, avatar: undefined };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Avatar removed successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'remove avatar');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  // Address management
  const addAddress = useCallback(async (address: Omit<Address, 'id'>): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiClient.post('/api/profile/addresses', address);
      const newAddress = response.data;
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          addresses: [...profile.addresses, newAddress]
        };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Address added successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'add address');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  const updateAddress = useCallback(async (id: string, updates: Partial<Address>): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiClient.patch(`/api/profile/addresses/${id}`, updates);
      const updatedAddress = response.data;
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          addresses: profile.addresses.map(addr => 
            addr.id === id ? updatedAddress : addr
          )
        };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Address updated successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'update address');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  const removeAddress = useCallback(async (id: string): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      await apiClient.delete(`/api/profile/addresses/${id}`);
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          addresses: profile.addresses.filter(addr => addr.id !== id)
        };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Address removed successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'remove address');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  const setDefaultAddress = useCallback(async (id: string, type: 'shipping' | 'billing'): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      await apiClient.patch(`/api/profile/addresses/${id}/default`, { type });
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          addresses: profile.addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id && addr.type === type
          }))
        };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: `Default ${type} address updated`,
      });

      return true;
    } catch (error) {
      handleError(error, 'set default address');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  // Security operations
  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      await apiClient.post('/api/profile/change-password', {
        currentPassword,
        newPassword
      });

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      return true;
    } catch (error) {
      handleError(error, 'change password');
      return false;
    } finally {
      setSaving(false);
    }
  }, [handleError, toast]);

  const enableTwoFactor = useCallback(async (): Promise<{ qrCode: string; backupCodes: string[] } | null> => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiClient.post('/api/profile/2fa/enable');
      return response.data;
    } catch (error) {
      handleError(error, 'enable two-factor authentication');
      return null;
    } finally {
      setSaving(false);
    }
  }, [handleError]);

  const disableTwoFactor = useCallback(async (code: string): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      await apiClient.post('/api/profile/2fa/disable', { code });
      
      if (profile) {
        const updatedProfile = { ...profile, twoFactorEnabled: false };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Two-factor authentication disabled",
      });

      return true;
    } catch (error) {
      handleError(error, 'disable two-factor authentication');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  // Preferences
  const updateNotificationPreferences = useCallback(async (preferences: NotificationPreferences): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await apiClient.patch('/api/profile/preferences/notifications', preferences);
      const updatedPreferences = response.data;
      
      if (profile) {
        const updatedProfile = {
          ...profile,
          preferences: {
            ...profile.preferences,
            notifications: updatedPreferences
          }
        };
        setProfile(updatedProfile);
        setOriginalProfile(structuredClone(updatedProfile));
        
        if (enableCache) {
          setCachedProfile(updatedProfile);
        }
      }

      toast({
        title: "Success",
        description: "Notification preferences updated",
      });

      return true;
    } catch (error) {
      handleError(error, 'update notification preferences');
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile, handleError, enableCache, setCachedProfile, toast]);

  // Utilities
  const resetChanges = useCallback(() => {
    if (originalProfile) {
      setProfile(structuredClone(originalProfile));
    }
  }, [originalProfile]);

  const validateProfile = useCallback((): string[] => {
    if (!profile) return [];
    return validateUserProfile(profile);
  }, [profile]);

  // Auto-save functionality
  useEffect(() => {
    if (!enableAutoSave || !isDirty || saving) return;

    const timeoutId = setTimeout(() => {
      if (profile && isDirty) {
        updateProfile(profile);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [enableAutoSave, isDirty, saving, profile, updateProfile, autoSaveDelay]);

  // Initial load
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    // State
    profile,
    loading,
    saving,
    error,
    isDirty,
    
    // Actions
    updateProfile,
    refreshProfile,
    uploadAvatar,
    removeAvatar,
    
    // Address management
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    
    // Security
    changePassword,
    enableTwoFactor,
    disableTwoFactor,
    
    // Preferences
    updateNotificationPreferences,
    
    // Utilities
    resetChanges,
    validateProfile,
  };
}