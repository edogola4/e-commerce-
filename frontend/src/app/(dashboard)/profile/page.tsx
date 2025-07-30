// frontend/src/app/(dashboard)/profile/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import { User, Settings, Package, Heart, MapPin, Bell, CreditCard, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/dashboard/profile-form';
import { AddressManager } from '@/components/dashboard/address-manager';
import { OrderHistory } from '@/components/dashboard/order-history';
import { WishlistManager } from '@/components/dashboard/wishlist-manager';
import { SecuritySettings } from '@/components/dashboard/security-settings';
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import { useAuth, useProtectedRoute } from '@/hooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Types for better type safety
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isEmailVerified?: boolean;
  avatar?: string;
  orders?: Array<any>;
  wishlist?: Array<any>;
  addresses?: Array<any>;
  createdAt?: string;
  lastLoginAt?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

interface UserStats {
  totalOrders: number;
  wishlistItems: number;
  savedAddresses: number;
  accountAge?: string;
}

// Utility functions moved outside component for better performance
const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

const createUserDisplayHelpers = () => {
  const getDisplayName = (user: UserProfile | null): string => {
    if (!user) return 'User';
    
    try {
      // Priority: firstName + lastName > name > email prefix
      if (user.firstName || user.lastName) {
        const firstName = sanitizeString(user.firstName || '');
        const lastName = sanitizeString(user.lastName || '');
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || 'User';
      }
      
      if (user.name) {
        return sanitizeString(user.name) || 'User';
      }
      
      if (user.email) {
        const emailPrefix = user.email.split('@')[0];
        return sanitizeString(emailPrefix) || 'User';
      }
      
      return 'User';
    } catch (error) {
      console.warn('Error getting display name:', error);
      return 'User';
    }
  };

  const getInitials = (user: UserProfile | null): string => {
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

  const getEmail = (user: UserProfile | null): string => {
    return user?.email || 'No email provided';
  };

  const isVerified = (user: UserProfile | null): boolean => {
    return Boolean(user?.isEmailVerified);
  };

  return { getDisplayName, getInitials, getEmail, isVerified };
};

// Memoized user helpers
const userHelpers = createUserDisplayHelpers();

// Component for user info card
const UserInfoCard = ({ user }: { user: UserProfile }) => {
  const displayName = userHelpers.getDisplayName(user);
  const initials = userHelpers.getInitials(user);
  const email = userHelpers.getEmail(user);
  const isVerified = userHelpers.isVerified(user);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${displayName}'s avatar`}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div className={`w-16 h-16 bg-primary rounded-full flex items-center justify-center ${user.avatar ? 'absolute inset-0' : ''}`}>
              <span className="text-primary-foreground text-xl font-bold">
                {initials}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{displayName}</h3>
            <p className="text-sm text-muted-foreground truncate" title={email}>
              {email}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={isVerified ? "default" : "secondary"}
                className="text-xs"
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${isVerified ? 'bg-green-500' : 'bg-orange-500'}`} />
                {isVerified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for navigation menu
const NavigationMenu = ({ 
  menuItems, 
  activeTab, 
  onTabChange 
}: {
  menuItems: MenuItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => (
  <Card>
    <CardContent className="p-2">
      <nav className="space-y-1" role="navigation" aria-label="Profile sections">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted focus:bg-muted'
            }`}
            aria-current={activeTab === item.id ? 'page' : undefined}
            title={item.description}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge variant="secondary" className="text-xs">
                {item.badge > 99 ? '99+' : item.badge}
              </Badge>
            )}
          </button>
        ))}
      </nav>
    </CardContent>
  </Card>
);

// Component for stats card
const StatsCard = ({ stats }: { stats: UserStats }) => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.totalOrders}
          </div>
          <div className="text-sm text-muted-foreground">Total Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.wishlistItems}
          </div>
          <div className="text-sm text-muted-foreground">Wishlist Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {stats.savedAddresses}
          </div>
          <div className="text-sm text-muted-foreground">Saved Addresses</div>
        </div>
        {stats.accountAge && (
          <div className="text-center">
            <div className="text-lg font-semibold text-muted-foreground">
              {stats.accountAge}
            </div>
            <div className="text-xs text-muted-foreground">Member Since</div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Loading skeleton component
const ProfilePageSkeleton = () => (
  <div className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg h-32 w-full" />
        ))}
      </div>
      <div className="lg:col-span-3 space-y-4">
        <div className="animate-pulse bg-muted rounded-lg h-8 w-1/4" />
        <div className="animate-pulse bg-muted rounded-lg h-96 w-full" />
      </div>
    </div>
  </div>
);

// Main component
export default function ProfilePage() {
  const { isAuthenticated, isLoading, error } = useProtectedRoute();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');

  // Memoized calculations
  const userStats = useMemo((): UserStats => {
    if (!user) return { totalOrders: 0, wishlistItems: 0, savedAddresses: 0 };
    
    const accountAge = user.createdAt 
      ? new Date(user.createdAt).getFullYear().toString()
      : undefined;

    return {
      totalOrders: user.orders?.length || 0,
      wishlistItems: user.wishlist?.length || 0,
      savedAddresses: user.addresses?.length || 0,
      accountAge
    };
  }, [user]);

  const menuItems = useMemo((): MenuItem[] => [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User,
      description: 'Edit your personal information'
    },
    { 
      id: 'orders', 
      label: 'Orders', 
      icon: Package,
      badge: userStats.totalOrders,
      description: 'View your order history'
    },
    { 
      id: 'wishlist', 
      label: 'Wishlist', 
      icon: Heart,
      badge: userStats.wishlistItems,
      description: 'Manage your saved items'
    },
    { 
      id: 'addresses', 
      label: 'Addresses', 
      icon: MapPin,
      badge: userStats.savedAddresses,
      description: 'Manage shipping addresses'
    },
    { 
      id: 'security', 
      label: 'Security', 
      icon: Shield,
      description: 'Password and security settings'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell,
      description: 'Notification preferences'
    },
  ], [userStats]);

  // Callbacks
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    // Track tab navigation for analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'profile_tab_change', {
        tab_name: tab
      });
    }
  }, []);

  // Loading state
  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            {error.message || 'An error occurred while loading your profile. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Unauthenticated state
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-muted-foreground">
            Manage your profile, orders, and account settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-4">
            <UserInfoCard user={user} />
            <NavigationMenu 
              menuItems={menuItems}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
            <StatsCard stats={userStats} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProfileForm user={user} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Order History</CardTitle>
                    <CardDescription>
                      View and manage your past orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OrderHistory />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="wishlist">
                <Card>
                  <CardHeader>
                    <CardTitle>My Wishlist</CardTitle>
                    <CardDescription>
                      Items you've saved for later
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WishlistManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="addresses">
                <Card>
                  <CardHeader>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>
                      Manage your shipping and billing addresses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AddressManager />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SecuritySettings />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Choose how you want to receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NotificationSettings />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}