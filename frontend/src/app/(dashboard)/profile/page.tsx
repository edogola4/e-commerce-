// frontend/src/app/(dashboard)/profile/page.tsx
'use client';

import { useState } from 'react';
import { User, Settings, Package, Heart, MapPin, Bell, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/dashboard/profile-form';
import { AddressManager } from '@/components/dashboard/address-manager';
import { OrderHistory } from '@/components/dashboard/order-history';
import { WishlistManager } from '@/components/dashboard/wishlist-manager';
import { SecuritySettings } from '@/components/dashboard/security-settings';
import { NotificationSettings } from '@/components/dashboard/notification-settings';
import { useAuth, useProtectedRoute } from '@/hooks';

// Helper functions to safely handle user data
const getUserDisplayName = (user: any): string => {
  if (!user) return 'User';
  
  // If user has firstName and lastName (from backend)
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  
  // Fallback to name field if it exists
  if (user.name) {
    return user.name;
  }
  
  // Final fallback
  return user.email ? user.email.split('@')[0] : 'User';
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
  
  // Final fallback
  return user.email ? user.email.charAt(0).toUpperCase() : 'U';
};

const getUserEmail = (user: any): string => {
  return user?.email || 'No email';
};

const isEmailVerified = (user: any): boolean => {
  return user?.isEmailVerified || false;
};

export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-lg h-12 w-full" />
            ))}
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="animate-pulse bg-muted rounded-lg h-8 w-1/4" />
            <div className="animate-pulse bg-muted rounded-lg h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'security', label: 'Security', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

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
            {/* User Info Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-xl font-bold">
                      {getUserInitials(user)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{getUserDisplayName(user)}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {getUserEmail(user)}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${isEmailVerified(user) ? 'bg-green-500' : 'bg-orange-500'}`} />
                      <span className="text-xs text-muted-foreground">
                        {isEmailVerified(user) ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Menu */}
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {user?.orders?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {user?.wishlist?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Wishlist Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {user?.addresses?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Saved Addresses</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Profile Tab */}
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

              {/* Orders Tab */}
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

              {/* Wishlist Tab */}
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

              {/* Addresses Tab */}
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

              {/* Security Tab */}
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

              {/* Notifications Tab */}
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