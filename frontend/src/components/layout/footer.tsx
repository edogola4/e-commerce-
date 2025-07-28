'use client';

import Link from 'next/link';
import { useState, useCallback, useMemo, memo } from 'react';
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Smartphone,
  Shield,
  Truck,
  ArrowRight,
  Send,
  ExternalLink,
  Award,
  Clock,
  Users,
  Globe,
  Heart,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FooterLink {
  readonly label: string;
  readonly href: string;
  readonly external?: boolean;
  readonly badge?: string;
  readonly description?: string;
}

interface SocialLink {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly href: string;
  readonly label: string;
  readonly color: string;
  readonly hoverColor: string;
  readonly followers?: string;
}

interface Feature {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
  readonly description: string;
  readonly gradient: string;
  readonly stats?: string;
}

interface PaymentMethod {
  readonly name: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly color: string;
  readonly hover: string;
  readonly description: string;
}

interface ContactInfo {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly text: string;
  readonly href?: string;
  readonly type: 'address' | 'phone' | 'email';
}

interface NewsletterFormData {
  email: string;
  preferences?: string[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates email address format using modern regex pattern
 * @param email - Email string to validate
 * @returns Boolean indicating if email is valid
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 255);
};

/**
 * Generates proper ARIA labels for links
 * @param label - Link label
 * @param external - Whether link is external
 * @returns Accessible ARIA label
 */
const generateLinkAriaLabel = (label: string, external: boolean = false): string => {
  return external ? `${label} (opens in new tab)` : label;
};

/**
 * Formats large numbers with appropriate suffixes
 * @param num - Number to format
 * @returns Formatted string (e.g., "1.2K", "3.4M")
 */
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

/**
 * Custom X (Twitter) icon component with optimized SVG
 */
const XIcon = memo(({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="X (formerly Twitter)"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
));

XIcon.displayName = 'XIcon';

/**
 * Footer navigation structure with enhanced metadata
 */
const FOOTER_LINKS: Record<string, FooterLink[]> = {
  shop: [
    { label: 'All Categories', href: '/categories', description: 'Browse our complete product catalog' },
    { label: 'Electronics', href: '/categories/electronics', badge: 'Hot' },
    { label: 'Fashion', href: '/categories/fashion', badge: 'New' },
    { label: 'Home & Garden', href: '/categories/home-garden' },
    { label: 'Sports & Outdoors', href: '/categories/sports' },
    { label: 'Books', href: '/categories/books' },
    { label: 'Today\'s Deals', href: '/deals', badge: 'Limited' },
  ],
  customer: [
    { label: 'My Account', href: '/profile', description: 'Manage your account settings' },
    { label: 'Order History', href: '/orders' },
    { label: 'Track Your Order', href: '/track-order', badge: 'Live' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Help & Support', href: '/contact', badge: '24/7' },
    { label: 'Returns & Exchanges', href: '/returns' },
    { label: 'Size Guide', href: '/size-guide' },
  ],
  company: [
    { label: 'About Us', href: '/about', description: 'Our story and mission' },
    { label: 'Careers', href: '/careers', badge: 'Hiring' },
    { label: 'Press', href: '/press' },
    { label: 'Sustainability', href: '/sustainability', badge: 'Green' },
    { label: 'Investor Relations', href: '/investors', external: true },
    { label: 'Affiliate Program', href: '/affiliates', badge: 'Earn' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy', description: 'How we protect your data' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR Compliance', href: '/gdpr', badge: 'EU' },
    { label: 'Accessibility', href: '/accessibility', badge: 'WCAG' },
  ],
} as const;

/**
 * Social media links with enhanced metadata
 */
const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    icon: Facebook,
    href: 'https://facebook.com/ecommercy',
    label: 'Facebook',
    color: 'text-blue-600',
    hoverColor: 'hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    followers: '125K'
  },
  {
    icon: XIcon,
    href: 'https://x.com/ecommercy',
    label: 'X (formerly Twitter)',
    color: 'text-gray-900 dark:text-white',
    hoverColor: 'hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
    followers: '89K'
  },
  {
    icon: Instagram,
    href: 'https://instagram.com/ecommercy',
    label: 'Instagram',
    color: 'text-pink-600',
    hoverColor: 'hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20',
    followers: '203K'
  },
  {
    icon: Youtube,
    href: 'https://youtube.com/ecommercy',
    label: 'YouTube',
    color: 'text-red-600',
    hoverColor: 'hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20',
    followers: '56K'
  },
] as const;

/**
 * Feature highlights with enhanced metrics
 */
const FEATURES: readonly Feature[] = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over KES 1,000',
    gradient: 'from-blue-500 to-cyan-500',
    stats: '2-3 days delivery'
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'SSL encrypted checkout',
    gradient: 'from-green-500 to-emerald-500',
    stats: '99.9% uptime'
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Always here to help',
    gradient: 'from-purple-500 to-violet-500',
    stats: 'Avg. 2min response'
  },
  {
    icon: Award,
    title: 'Quality Guarantee',
    description: '30-day return policy',
    gradient: 'from-orange-500 to-red-500',
    stats: '98% satisfaction'
  },
] as const;

/**
 * Payment methods with enhanced information
 */
const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    name: 'M-PESA',
    icon: Smartphone,
    color: 'bg-green-600',
    hover: 'hover:bg-green-500',
    description: 'Mobile money payments'
  },
  {
    name: 'AIRTEL MONEY',
    icon: Smartphone,
    color: 'bg-red-600',
    hover: 'hover:bg-red-500',
    description: 'Mobile money payments'
  },
  {
    name: 'VISA',
    icon: CreditCard,
    color: 'bg-blue-600',
    hover: 'hover:bg-blue-500',
    description: 'Credit and debit cards'
  },
  {
    name: 'MASTERCARD',
    icon: CreditCard,
    color: 'bg-orange-600',
    hover: 'hover:bg-orange-500',
    description: 'Worldwide acceptance'
  }
] as const;

/**
 * Contact information with enhanced accessibility
 */
const CONTACT_INFO: readonly ContactInfo[] = [
  {
    icon: MapPin,
    text: 'Nairobi, Kenya',
    type: 'address',
    href: 'https://maps.google.com/nairobi-kenya'
  },
  {
    icon: Phone,
    text: '+254 700 123 456',
    type: 'phone',
    href: 'tel:+254700123456'
  },
  {
    icon: Mail,
    text: 'support@ecommercy.co.ke',
    type: 'email',
    href: 'mailto:support@ecommercy.co.ke'
  }
] as const;

// ============================================================================
// MEMOIZED COMPONENTS
// ============================================================================

/**
 * Memoized feature card component for optimal performance
 */
const FeatureCard = memo(({ feature, index }: { feature: Feature; index: number }) => (
  <div
    className={cn(
      "group flex items-center space-x-4 p-4 rounded-2xl transition-all duration-500 cursor-pointer",
      "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm",
      "border border-white/20 dark:border-slate-700/20",
      "hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50",
      "hover:-translate-y-2 hover:scale-105"
    )}
    style={{ animationDelay: `${index * 100}ms` }}
    role="button"
    tabIndex={0}
    aria-label={`${feature.title}: ${feature.description}`}
  >
    <div className={cn(
      "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
      "transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
      `bg-gradient-to-br ${feature.gradient}`
    )}>
      <feature.icon className="h-6 w-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
        {feature.title}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors">
        {feature.description}
      </p>
      {feature.stats && (
        <Badge variant="secondary" className="mt-1 text-xs opacity-75 group-hover:opacity-100">
          {feature.stats}
        </Badge>
      )}
    </div>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

/**
 * Memoized footer link component with enhanced accessibility
 */
const FooterLinkItem = memo(({ link, index }: { link: FooterLink; index: number }) => (
  <li style={{ animationDelay: `${index * 50}ms` }}>
    <Link
      href={link.href}
      target={link.external ? '_blank' : undefined}
      rel={link.external ? 'noopener noreferrer' : undefined}
      className={cn(
        "group flex items-center text-slate-600 dark:text-slate-400",
        "hover:text-slate-900 dark:hover:text-slate-200",
        "transition-all duration-300 hover:translate-x-2",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-md p-1"
      )}
      aria-label={generateLinkAriaLabel(link.label, link.external)}
    >
      <div className="flex items-center space-x-2 flex-1">
        <span className="text-sm font-medium">{link.label}</span>
        {link.badge && (
          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
          >
            {link.badge}
          </Badge>
        )}
      </div>
      {link.external ? (
        <ExternalLink className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300" />
      ) : (
        <ArrowRight className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300" />
      )}
    </Link>
    {link.description && (
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {link.description}
      </p>
    )}
  </li>
));

FooterLinkItem.displayName = 'FooterLinkItem';

/**
 * Memoized social link component with follower counts
 */
const SocialLinkButton = memo(({ social, index }: { social: SocialLink; index: number }) => (
  <div className="relative group">
    <Button
      variant="ghost"
      size="icon"
      asChild
      className={cn(
        "h-12 w-12 rounded-xl border transition-all duration-300",
        "bg-slate-100 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700",
        "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
        "hover:shadow-lg hover:scale-110 hover:-translate-y-1",
        social.hoverColor
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <a
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Follow us on ${social.label} (${social.followers} followers)`}
        className="group flex items-center justify-center w-full h-full"
      >
        <social.icon className={cn(
          "h-5 w-5 transition-all duration-300 group-hover:scale-125",
          social.color
        )} />
      </a>
    </Button>
    {social.followers && (
      <div className={cn(
        "absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500",
        "text-white text-xs font-bold px-1.5 py-0.5 rounded-full",
        "opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
      )}>
        {social.followers}
      </div>
    )}
  </div>
));

SocialLinkButton.displayName = 'SocialLinkButton';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Enhanced Footer Component with professional features
 * 
 * Features:
 * - Comprehensive link organization with metadata
 * - Enhanced accessibility and keyboard navigation
 * - Professional animations and micro-interactions
 * - Secure newsletter signup with validation
 * - Performance optimized with memoization
 * - SEO-friendly structure with proper schema
 * - Mobile-responsive design
 * - Professional error handling
 */
export function Footer() {
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  const [email, setEmail] = useState<string>('');
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { success, error } = useToast();

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const isEmailValid = useMemo(() => isValidEmail(email), [email]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handles newsletter signup with comprehensive validation and error handling
   */
  const handleNewsletterSignup = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const sanitizedEmail = sanitizeInput(email);

    // Client-side validation
    if (!sanitizedEmail) {
      error('Please enter your email address');
      return;
    }

    if (!isEmailValid) {
      error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    setSubscriptionStatus('idle');

    try {
      // API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      await api.newsletter.subscribe(sanitizedEmail, {
        signal: controller.signal,
        preferences: ['deals', 'new-products'] // Default preferences
      });

      clearTimeout(timeoutId);

      setSubscriptionStatus('success');
      success('Successfully subscribed to newsletter! Check your email for confirmation.');
      setEmail('');

      // Track successful subscription
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'newsletter_signup', {
          event_category: 'engagement',
          event_label: 'footer'
        });
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setSubscriptionStatus('error');

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          error('Request timed out. Please try again.');
        } else if (err.message.includes('already subscribed')) {
          error('This email is already subscribed to our newsletter.');
        } else {
          error('Failed to subscribe. Please try again later.');
        }
      } else {
        error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubscribing(false);
    }
  }, [email, isEmailValid, success, error]);

  /**
   * Handles email input changes with real-time validation
   */
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(e.target.value);
    setEmail(value);
    setSubscriptionStatus('idle');
  }, []);

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  /**
   * Renders a footer section with proper heading structure
   */
  const renderFooterSection = useCallback((
    title: string,
    links: FooterLink[],
    gradientColors: string
  ) => (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 relative">
        {title}
        <div className={cn(
          "absolute -bottom-2 left-0 w-8 h-1 rounded-full",
          `bg-gradient-to-r ${gradientColors}`
        )} />
      </h3>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <FooterLinkItem key={link.href} link={link} index={index} />
        ))}
      </ul>
    </div>
  ), []);

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <footer
      className={cn(
        "bg-gradient-to-br from-slate-50 via-white to-slate-50",
        "dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
        "border-t border-slate-200 dark:border-slate-800 relative overflow-hidden"
      )}
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className={cn(
          "absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse",
          "bg-gradient-to-r from-blue-400/20 to-purple-400/20"
        )} />
        <div className={cn(
          "absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000",
          "bg-gradient-to-r from-pink-400/20 to-orange-400/20"
        )} />
      </div>

      {/* Features Section */}
      <section
        className={cn(
          "relative py-12 border-b border-slate-200/50 dark:border-slate-700/50",
          "bg-gradient-to-r from-slate-100/80 to-slate-50/80",
          "dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-sm"
        )}
        aria-label="Service features"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={feature.title} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Main Footer Content */}
      <section className="relative py-16" aria-label="Footer navigation">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">

            {/* Company Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="group flex items-center space-x-3 mb-6">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                  "bg-gradient-to-br from-indigo-600 to-amber-500",
                  "group-hover:shadow-xl group-hover:scale-105 transition-all duration-300"
                )}>
                  <span className="text-white font-bold text-xl">E</span>
                </div>
                <span className={cn(
                  "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  "from-indigo-700 to-amber-600 dark:from-indigo-300 dark:to-amber-300"
                )}>
                  ECommercy
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                Your ultimate shopping destination with personalized recommendations,
                secure payments, and fast delivery across Kenya. Trusted by over 100,000 customers.
              </p>

              {/* Enhanced Contact Information */}
              <div className="space-y-3">
                {CONTACT_INFO.map((contact, index) => (
                  <div
                    key={contact.type}
                    className={cn(
                      "group flex items-center space-x-3 transition-colors duration-300",
                      "text-slate-600 dark:text-slate-400",
                      "hover:text-slate-900 dark:hover:text-slate-200",
                      contact.href ? "cursor-pointer" : ""
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      "bg-slate-100 dark:bg-slate-800",
                      "group-hover:bg-slate-200 dark:group-hover:bg-slate-700",
                      "group-hover:scale-110"
                    )}>
                      <contact.icon className="h-4 w-4" />
                    </div>
                    {contact.href ? (
                      <a
                        href={contact.href}
                        className="text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded"
                        aria-label={`Contact us via ${contact.type}: ${contact.text}`}
                      >
                        {contact.text}
                      </a>
                    ) : (
                      <span className="text-sm font-medium">{contact.text}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Enhanced Social Links */}
              <div className="flex space-x-3 pt-4">
                {SOCIAL_LINKS.map((social, index) => (
                  <SocialLinkButton key={social.label} social={social} index={index} />
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-4 pt-4">
                <div className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                    100K+ Customers
                  </span>
                </div>
                <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    4.8/5 Rating
                  </span>
                </div>
              </div>
            </div>

            {/* Shop Links */}
            {renderFooterSection(
              'Shop',
              FOOTER_LINKS.shop,
              'from-blue-500 to-purple-500'
            )}

            {/* Customer Service Links */}
            {renderFooterSection(
              'Customer Service',
              FOOTER_LINKS.customer,
              'from-green-500 to-emerald-500'
            )}

            {/* Company Links */}
            {renderFooterSection(
              'Company',
              FOOTER_LINKS.company,
              'from-purple-500 to-pink-500'
            )}

            {/* Newsletter & Legal */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 relative">
                Stay Updated
                <div className="absolute -bottom-2 left-0 w-8 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
              </h3>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Subscribe to our newsletter for exclusive deals, new arrivals, and insider tips.
              </p>

              {/* Enhanced Newsletter Form */}
              <form onSubmit={handleNewsletterSignup} className="space-y-4">
                <div className="relative group">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={handleEmailChange}
                    disabled={isSubscribing}
                    className={cn(
                      "pr-12 h-12 transition-all duration-300 rounded-xl",
                      "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                      "border-slate-200 dark:border-slate-700",
                      email && !isEmailValid && "border-red-500 dark:border-red-400",
                      email && isEmailValid && "border-green-500 dark:border-green-400",
                      "focus:border-blue-500 dark:focus:border-blue-400",
                      "focus:ring-2 focus:ring-blue-500/20"
                    )}
                    aria-label="Email address for newsletter subscription"
                    aria-describedby="email-validation"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {email && !isEmailValid && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {email && isEmailValid && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {!email && (
                      <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                    )}
                  </div>
                </div>

                {email && !isEmailValid && (
                  <p id="email-validation" className="text-xs text-red-500 dark:text-red-400">
                    Please enter a valid email address
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubscribing || !isEmailValid || !email.trim()}
                  className={cn(
                    "w-full h-12 font-semibold rounded-xl shadow-lg transition-all duration-300 group",
                    "bg-gradient-to-r from-blue-600 to-purple-600",
                    "hover:from-blue-700 hover:to-purple-700",
                    "hover:shadow-xl hover:scale-105",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  )}
                  aria-label={isSubscribing ? 'Subscribing to newsletter' : 'Subscribe to newsletter'}
                >
                  <span className="flex items-center justify-center space-x-2">
                    {isSubscribing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe</span>
                        <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </span>
                </Button>

                {/* Subscription Status Feedback */}
                {subscriptionStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Successfully subscribed!</span>
                  </div>
                )}

                {subscriptionStatus === 'error' && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Subscription failed. Please try again.</span>
                  </div>
                )}
              </form>

              {/* Legal Links */}
              <div className="pt-4 space-y-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Legal</h4>
                <ul className="space-y-2">
                  {FOOTER_LINKS.legal.map((link, index) => (
                    <li key={link.href} style={{ animationDelay: `${index * 50}ms` }}>
                      <Link
                        href={link.href}
                        className={cn(
                          "group flex items-center text-xs transition-all duration-300",
                          "text-slate-500 dark:text-slate-500",
                          "hover:text-slate-700 dark:hover:text-slate-300",
                          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded p-1"
                        )}
                        aria-label={generateLinkAriaLabel(link.label, link.external)}
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <Badge variant="outline" className="ml-2 text-xs px-1 py-0">
                            {link.badge}
                          </Badge>
                        )}
                        <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Enhanced Bottom Section */}
      <section
        className={cn(
          "relative py-8",
          "bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm"
        )}
        aria-label="Footer bottom information"
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0 gap-8">

            {/* Copyright & Attribution */}
            <div className="text-slate-600 dark:text-slate-400 text-center lg:text-left">
              <p className="font-medium flex items-center justify-center lg:justify-start space-x-2">
                <span>© {currentYear} ECommercy. All rights reserved.</span>
                <Globe className="h-4 w-4" />
              </p>
              <p className="text-xs mt-1 flex items-center justify-center lg:justify-start space-x-1">
                <span>Made with</span>
                <Heart className="h-3 w-3 text-red-500 fill-current" />
                <span>in Kenya</span>
              </p>
            </div>

            {/* Enhanced Payment Methods */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Secure payments:</span>
              </span>
              <div className="flex items-center space-x-3">
                {PAYMENT_METHODS.map((payment, index) => (
                  <div
                    key={payment.name}
                    className={cn(
                      "flex items-center space-x-2 text-white px-4 py-2 rounded-lg",
                      "text-xs font-bold shadow-md transition-all duration-300",
                      "hover:shadow-lg hover:scale-105 cursor-pointer",
                      payment.color,
                      payment.hover
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                    title={payment.description}
                    role="button"
                    tabIndex={0}
                    aria-label={`${payment.name} payment method: ${payment.description}`}
                  >
                    <payment.icon className="h-3 w-3" />
                    <span>{payment.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Security Badges */}
            <div className="flex items-center space-x-4">
              <div className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg border",
                "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                "border-slate-200 dark:border-slate-700",
                "shadow-sm hover:shadow-md transition-all duration-300"
              )}>
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  SSL Secured
                </span>
              </div>
              <div className={cn(
                "flex items-center space-x-2 px-4 py-2 rounded-lg border",
                "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm",
                "border-slate-200 dark:border-slate-700",
                "shadow-sm hover:shadow-md transition-all duration-300"
              )}>
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}