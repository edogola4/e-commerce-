'use client';

import { useState } from 'react';
import { Bell, Mail, Smartphone, Package, Tag, Heart, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks';

interface NotificationPreferences {
  email: {
    orderUpdates: boolean;
    promotions: boolean;
    newProducts: boolean;
    priceDrops: boolean;
    backInStock: boolean;
    newsletter: boolean;
  };
  push: {
    orderUpdates: boolean;
    promotions: boolean;
    newProducts: boolean;
    priceDrops: boolean;
    backInStock: boolean;
  };
  sms: {
    orderUpdates: boolean;
    promotions: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly';
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: {
      orderUpdates: true,
      promotions: true,
      newProducts: false,
      priceDrops: true,
      backInStock: true,
      newsletter: true,
    },
    push: {
      orderUpdates: true,
      promotions: false,
      newProducts: false,
      priceDrops: true,
      backInStock: true,
    },
    sms: {
      orderUpdates: true,
      promotions: false,
    },
    frequency: 'immediate',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const updatePreference = (
    type: keyof NotificationPreferences,
    setting: string,
    value: boolean | string
  ) => {
    setPreferences(prev => ({
      ...prev,
      [type]: typeof prev[type] === 'object' 
        ? { ...prev[type], [setting]: value }
        : value
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      // API call to save preferences
      await new Promise(resolve => setTimeout(resolve, 1000));
      success('Notification preferences updated successfully!');
    } catch (err) {
      error('Failed to update preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  const notificationTypes = [
    {
      key: 'orderUpdates',
      title: 'Order Updates',
      description: 'Notifications about your order status, shipping, and delivery',
      icon: Package,
    },
    {
      key: 'promotions',
      title: 'Promotions & Deals',
      description: 'Special offers, discounts, and flash sales',
      icon: Tag,
    },
    {
      key: 'newProducts',
      title: 'New Products',
      description: 'Latest arrivals and product launches',
      icon: ShoppingCart,
    },
    {
      key: 'priceDrops',
      title: 'Price Drops',
      description: 'Alerts when items in your wishlist go on sale',
      icon: Heart,
    },
    {
      key: 'backInStock',
      title: 'Back in Stock',
      description: 'When out-of-stock items become available again',
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Email Notifications</span>
          </CardTitle>
          <CardDescription>
            Choose what email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <type.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{type.title}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences.email[type.key as keyof typeof preferences.email]}
                onCheckedChange={(checked) => updatePreference('email', type.key, checked)}
              />
            </div>
          ))}

          {/* Newsletter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Newsletter</p>
                <p className="text-sm text-muted-foreground">Weekly digest of trends and featured products</p>
              </div>
            </div>
            <Switch
              checked={preferences.email.newsletter}
              onCheckedChange={(checked) => updatePreference('email', 'newsletter', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Push Notifications</span>
          </CardTitle>
          <CardDescription>
            Real-time notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <type.icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{type.title}</p>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>
              </div>
              <Switch
                checked={preferences.push[type.key as keyof typeof preferences.push]}
                onCheckedChange={(checked) => updatePreference('push', type.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>SMS Notifications</span>
          </CardTitle>
          <CardDescription>
            Text message alerts for important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Order Updates</p>
                <p className="text-sm text-muted-foreground">Critical order status changes</p>
              </div>
            </div>
            <Switch
              checked={preferences.sms.orderUpdates}
              onCheckedChange={(checked) => updatePreference('sms', 'orderUpdates', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Promotions</p>
                <p className="text-sm text-muted-foreground">Exclusive SMS-only deals</p>
              </div>
            </div>
            <Switch
              checked={preferences.sms.promotions}
              onCheckedChange={(checked) => updatePreference('sms', 'promotions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Frequency</CardTitle>
          <CardDescription>
            How often would you like to receive promotional notifications?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Frequency</label>
            <Select
              value={preferences.frequency}
              onValueChange={(value: 'immediate' | 'daily' | 'weekly') => 
                updatePreference('frequency', '', value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily">Daily Digest</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This setting only affects promotional notifications, not order updates
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}