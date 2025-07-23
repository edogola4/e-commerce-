'use client';

import { useState } from 'react';
import { Mail, Gift, Bell, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks';
import { api } from '@/lib/api';
import { isValidEmail } from '@/lib/utils';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.newsletter.subscribe(email, {
        deals: true,
        newProducts: true,
        newsletter: true,
      });
      
      success('Successfully subscribed! Welcome to our community 🎉');
      setEmail('');
    } catch (err) {
      error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Gift,
      title: 'Exclusive Deals',
      description: 'Get early access to sales and special discounts',
    },
    {
      icon: Bell,
      title: 'New Arrivals',
      description: 'Be the first to know about new products',
    },
    {
      icon: Star,
      title: 'Personalized Recommendations',
      description: 'Curated product suggestions just for you',
    },
  ];

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Mail className="h-8 w-8" />
            <h2 className="text-3xl font-bold">Stay in the Loop</h2>
          </div>
          <p className="text-xl text-primary-foreground/90 mb-6">
            Join our newsletter and never miss out on amazing deals, new products, and exclusive offers
          </p>
        </div>

        {/* Newsletter Form */}
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-white/20 focus:border-white text-gray-900 placeholder:text-gray-500"
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="bg-white text-primary hover:bg-white/90 px-8"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span>Subscribing...</span>
                  </div>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </form>
            
            <p className="text-sm text-primary-foreground/70 mt-3">
              Join over 10,000 subscribers and get 10% off your first order
            </p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/20">
                <benefit.icon className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-primary-foreground/80">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex items-center justify-center space-x-8 text-primary-foreground/80">
            <div className="text-center">
              <div className="text-2xl font-bold">10,000+</div>
              <div className="text-sm">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">50,000+</div>
              <div className="text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">4.8★</div>
              <div className="text-sm">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 text-xs text-primary-foreground/60">
          We respect your privacy. You can unsubscribe at any time. 
          Read our <a href="/privacy" className="underline hover:no-underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}