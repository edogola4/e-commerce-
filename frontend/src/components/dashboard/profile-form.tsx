// frontend/src/components/dashboard/profile-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth, useToast } from '@/hooks';
import { User as UserType } from '@/types';

interface ProfileFormProps {
  user: UserType;
}

// Helper functions to safely handle user data
const getUserDisplayName = (user: any): string => {
  if (!user) return '';
  
  // If user has firstName and lastName (from backend)
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  
  // Fallback to name field if it exists
  if (user.name) {
    return user.name;
  }
  
  return '';
};

const getUserInitials = (user: any): string => {
  if (!user) return 'U';
  
  // If user has firstName and lastName
  if (user.firstName || user.lastName) {
    const first = (user.firstName || '').charAt(0).toUpperCase();
    const last = (user.lastName || '').charAt(0).toUpperCase();
    return (first + last) || first || last || 'U';
  }
  
  // Fallback to name field
  if (user.name) {
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return nameParts[0].charAt(0).toUpperCase() + nameParts[1].charAt(0).toUpperCase();
    }
    return user.name.charAt(0).toUpperCase();
  }
  
  return 'U';
};

const splitName = (fullName: string): { firstName: string; lastName: string } => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }

  const nameParts = fullName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

  return { firstName, lastName };
};

export function ProfileForm({ user }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    fullName: '', // For display purposes
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateProfile } = useAuth();
  const { success, error } = useToast();

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user) {
      console.log('🔍 ProfileForm received user:', user);
      
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = getUserDisplayName(user);
      
      setFormData({
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phone || '',
        fullName,
      });
      
      console.log('📝 Form data set:', {
        firstName,
        lastName,
        fullName,
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // If changing fullName, split it into firstName and lastName
      if (field === 'fullName') {
        const { firstName, lastName } = splitName(value);
        updated.firstName = firstName;
        updated.lastName = lastName;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send data in the format backend expects
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
      };
      
      console.log('📤 Sending update data:', updateData);
      
      await updateProfile(updateData);
      success('Profile updated successfully!');
    } catch (err) {
      console.error('❌ Profile update error:', err);
      error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while user data is being loaded
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-6">
            <div className="h-24 w-24 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-48"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatar} alt={getUserDisplayName(user)} />
          <AvatarFallback className="text-2xl">
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Button type="button" variant="outline" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Change Avatar</span>
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            JPG, PNG or GIF. Max size 5MB.
          </p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="pl-10"
              disabled={isSubmitting}
              placeholder="Enter your full name"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This will be split into first and last name
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="pl-10"
              disabled={isSubmitting}
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="pl-10"
              placeholder="0700 123 456"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Account Status</Label>
          <div className="flex items-center space-x-2 pt-2">
            <div className={`w-2 h-2 rounded-full ${user.isEmailVerified ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="text-sm">
              {user.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h4 className="text-sm font-medium">Current Data</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>First Name: {formData.firstName || 'Not set'}</p>
          <p>Last Name: {formData.lastName || 'Not set'}</p>
          <p>Email: {formData.email || 'Not set'}</p>
          <p>Phone: {formData.phone || 'Not set'}</p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
}