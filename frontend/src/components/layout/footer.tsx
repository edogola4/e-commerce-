'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Smartphone,
  Shield,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks';
import { api } from '@/lib/api';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { success, error } = useToast();

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    try {
      await api.newsletter.subscribe(email);
      success('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (err) {
      error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const footerLinks = {
    shop: [
      { label: 'All Categories', href: '/categories' },
      { label: 'Electronics', href: '/categories/electronics' },
      { label: 'Fashion', href: '/categories/fashion' },
      { label: 'Home & Garden', href: '/categories/home-garden' },
      { label: 'Sports & Outdoors', href: '/categories/sports' },
      { label: 'Books', href: '/categories/books' },
      { label: 'Today\'s Deals', href: '/deals' },
    ],
    customer: [
      { label: 'My Account', href: '/profile' },
      { label: 'Order History', href: '/orders' },
      { label: 'Track Your Order', href: '/track-order' },
      { label: 'Wishlist', href: '/wishlist' },
      { label: 'Help & Support', href: '/contact' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'Size Guide', href: '/size-guide' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Sustainability', href: '/sustainability' },
      { label: 'Investor Relations', href: '/investors' },
      { label: 'Affiliate Program', href: '/affiliates' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
      { label: 'Accessibility', href: '/accessibility' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/ecommercy', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/ecommercy', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/ecommercy', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/ecommercy', label: 'YouTube' },
  ];

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over KES 1,000',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'SSL encrypted checkout',
    },
    {
      icon: Phone,
      title: '24/7 Support',
      description: 'Always here to help',
    },
    {
      icon: CreditCard,
      title: 'Easy Returns',
      description: '30-day return policy',
    },
  ];

  return (
    <footer className="bg-background border-t">
      {/* Features section */}
      <div className="bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Company info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">E</span>
                </div>
                <span className="text-xl font-bold">ECommercy</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Your ultimate shopping destination with personalized recommendations, 
                secure payments, and fast delivery across Kenya.
              </p>
              
              {/* Contact info */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Nairobi, Kenya</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+254 700 123 456</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>support@ecommercy.co.ke</span>
                </div>
              </div>

              {/* Social links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>

            {/* Shop links */}
            <div>
              <h3 className="font-semibold mb-4">Shop</h3>
              <ul className="space-y-2">
                {footerLinks.shop.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer service links */}
            <div>
              <h3 className="font-semibold mb-4">Customer Service</h3>
              <ul className="space-y-2">
                {footerLinks.customer.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter signup */}
            <div>
              <h3 className="font-semibold mb-4">Stay Updated</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Subscribe to our newsletter for the latest deals and updates.
              </p>
              <form onSubmit={handleNewsletterSignup} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
              
              {/* Legal links */}
              <div className="mt-6">
                <h4 className="font-medium text-sm mb-2">Legal</h4>
                <ul className="space-y-1">
                  {footerLinks.legal.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom section */}
      <div className="py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ECommercy. All rights reserved.
            </div>

            {/* Payment methods */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">We accept:</span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                  <Smartphone className="h-3 w-3" />
                  <span>M-PESA</span>
                </div>
                <div className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  <CreditCard className="h-3 w-3" />
                  <span>VISA</span>
                </div>
                <div className="flex items-center space-x-1 bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                  <CreditCard className="h-3 w-3" />
                  <span>MASTERCARD</span>
                </div>
              </div>
            </div>

            {/* Security badges */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>SSL Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}