// frontend/src/components/home/hero-section.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Star,
  ArrowRight,
  Truck,
  Shield,
  Sparkles,
  Award,
  Gift,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  TrendingUp,
  Users,
  Globe,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  badge?: string;
  badgeVariant?: 'hot' | 'new' | 'bestseller' | 'limited';
  colorScheme: 'slate' | 'emerald' | 'blue' | 'violet';
  features?: string[];
  discount?: string;
  originalPrice?: string;
  salePrice?: string;
  stats?: {
    customers: string;
    products: string;
    rating: string;
  };
}

const heroSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'Premium Electronics',
    subtitle: 'Professional-Grade Technology',
    description: 'Discover enterprise-quality electronics with cutting-edge features, professional warranties, and dedicated business support.',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=800&fit=crop&q=80',
    buttonText: 'Explore Electronics',
    buttonLink: '/categories/electronics',
    secondaryButtonText: 'Request Demo',
    secondaryButtonLink: '/demo',
    badge: 'Business Solutions',
    badgeVariant: 'hot',
    colorScheme: 'slate',
    features: ['Enterprise Support', 'Bulk Pricing', 'Extended Warranty', 'White-glove Setup'],
    discount: '25%',
    originalPrice: 'KES 80,000',
    salePrice: 'KES 60,000',
    stats: {
      customers: '10K+',
      products: '500+',
      rating: '4.9'
    }
  },
  {
    id: '2',
    title: 'Sustainable Fashion',
    subtitle: 'Conscious Commerce Collection',
    description: 'Ethically sourced, premium fashion with transparent supply chains and carbon-neutral shipping.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=80',
    buttonText: 'Shop Sustainably',
    buttonLink: '/categories/fashion',
    secondaryButtonText: 'Sustainability Report',
    secondaryButtonLink: '/sustainability',
    badge: 'Eco-Certified',
    badgeVariant: 'new',
    colorScheme: 'emerald',
    features: ['Carbon Neutral', 'Fair Trade', 'Organic Materials', 'Circular Design'],
    discount: '30%',
    originalPrice: 'KES 12,000',
    salePrice: 'KES 8,400',
    stats: {
      customers: '25K+',
      products: '1.2K+',
      rating: '4.8'
    }
  },
  {
    id: '3',
    title: 'Smart Living Solutions',
    subtitle: 'Connected Home Ecosystem',
    description: 'Transform your space with intelligent home solutions designed for modern living and enhanced productivity.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop&q=80',
    buttonText: 'Smart Home Setup',
    buttonLink: '/categories/smart-home',
    secondaryButtonText: 'Consultation',
    secondaryButtonLink: '/consultation',
    badge: 'IoT Ready',
    badgeVariant: 'bestseller',
    colorScheme: 'blue',
    features: ['Smart Integration', 'Voice Control', 'Energy Monitoring', 'Security Suite'],
    discount: '35%',
    originalPrice: 'KES 25,000',
    salePrice: 'KES 16,250',
    stats: {
      customers: '15K+',
      products: '800+',
      rating: '4.9'
    }
  },
];

const colorSchemes = {
  slate: {
    primary: 'from-slate-900 via-slate-800 to-slate-900',
    accent: 'from-blue-500 to-indigo-600',
    glass: 'bg-slate-900/20 border-slate-700/30',
    text: 'text-slate-100',
    textSecondary: 'text-slate-300'
  },
  emerald: {
    primary: 'from-emerald-900 via-teal-800 to-emerald-900',
    accent: 'from-emerald-400 to-teal-500',
    glass: 'bg-emerald-900/20 border-emerald-700/30',
    text: 'text-emerald-50',
    textSecondary: 'text-emerald-200'
  },
  blue: {
    primary: 'from-blue-900 via-indigo-800 to-blue-900',
    accent: 'from-blue-400 to-cyan-500',
    glass: 'bg-blue-900/20 border-blue-700/30',
    text: 'text-blue-50',
    textSecondary: 'text-blue-200'
  },
  violet: {
    primary: 'from-violet-900 via-purple-800 to-violet-900',
    accent: 'from-violet-400 to-purple-500',
    glass: 'bg-violet-900/20 border-violet-700/30',
    text: 'text-violet-50',
    textSecondary: 'text-violet-200'
  }
};

const badgeVariants = {
  hot: { bg: 'bg-gradient-to-r from-red-500 to-orange-500', icon: '🔥' },
  new: { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: '✨' },
  bestseller: { bg: 'bg-gradient-to-r from-amber-500 to-yellow-500', icon: '🏆' },
  limited: { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', icon: '⚡' }
};

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide((current) => (current + 1) % heroSlides.length);
          return 0;
        }
        return prev + 1.25; // 8 seconds total
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentSlide, isPlaying]);

  const currentSlideData = heroSlides[currentSlide];
  const currentColors = colorSchemes[currentSlideData.colorScheme];

  const nextSlide = () => {
    setCurrentSlide((current) => (current + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <section className="relative min-h-[100vh] overflow-hidden">
      {/* Background with Enhanced Gradients */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br transition-all duration-1000',
        currentColors.primary
      )}>
        {/* Sophisticated background patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-y-12"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl animate-pulse"></div>
        </div>
      </div>

      {/* Hero Image with Parallax */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 scale-105 transition-all duration-1000 ease-out">
          <Image
            src={currentSlideData.image}
            alt={currentSlideData.title}
            fill
            className="object-cover opacity-20"
            priority={currentSlide === 0}
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-8 h-full min-h-[100vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">

          {/* Content Section */}
          <div className="space-y-8 lg:pr-8">
            {/* Badge */}
            {currentSlideData.badge && (
              <div className="animate-in slide-in-from-left duration-700 delay-200">
                <Badge className={cn(
                  'px-4 py-2 text-sm font-semibold text-white border-none shadow-lg',
                  badgeVariants[currentSlideData.badgeVariant || 'hot'].bg
                )}>
                  <span className="mr-2">{badgeVariants[currentSlideData.badgeVariant || 'hot'].icon}</span>
                  {currentSlideData.badge}
                </Badge>
              </div>
            )}

            {/* Main Heading */}
            <div className="space-y-6 animate-in slide-in-from-left duration-700 delay-300">
              <div className="space-y-4">
                <h1 className={cn(
                  'text-4xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight',
                  currentColors.text
                )}>
                  {currentSlideData.title}
                </h1>
                <p className={cn(
                  'text-xl lg:text-2xl font-medium bg-gradient-to-r bg-clip-text text-transparent',
                  currentColors.accent
                )}>
                  {currentSlideData.subtitle}
                </p>
                <p className={cn(
                  'text-lg leading-relaxed max-w-xl',
                  currentColors.textSecondary
                )}>
                  {currentSlideData.description}
                </p>
              </div>

              {/* Pricing Card */}
              {currentSlideData.discount && (
                <div className="animate-in slide-in-from-left duration-700 delay-500">
                  <div className={cn(
                    'inline-flex items-center space-x-6 rounded-2xl p-6 backdrop-blur-xl border shadow-2xl',
                    currentColors.glass
                  )}>
                    <div className="text-center">
                      <div className={cn('text-3xl font-bold', currentColors.text)}>
                        {currentSlideData.discount}
                      </div>
                      <div className={cn('text-sm font-medium', currentColors.textSecondary)}>
                        OFF
                      </div>
                    </div>
                    <div className={cn('border-l pl-6', `border-${currentSlideData.colorScheme}-700/30`)}>
                      <div className={cn('text-lg line-through', currentColors.textSecondary)}>
                        {currentSlideData.originalPrice}
                      </div>
                      <div className={cn('text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent', currentColors.accent)}>
                        {currentSlideData.salePrice}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-left duration-700 delay-700">
                <Button
                  size="lg"
                  asChild
                  className={cn(
                    'group h-14 px-8 font-semibold text-lg rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r text-white border-none',
                    currentColors.accent
                  )}
                >
                  <Link href={currentSlideData.buttonLink}>
                    <ShoppingBag className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    {currentSlideData.buttonText}
                    <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1 duration-300" />
                  </Link>
                </Button>

                {currentSlideData.secondaryButtonText && (
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className={cn(
                      'h-14 px-8 font-semibold text-lg rounded-xl backdrop-blur-sm hover:scale-105 transition-all duration-300 border-2',
                      currentColors.glass,
                      currentColors.text,
                      `hover:${currentColors.glass.replace('/20', '/30')}`
                    )}
                  >
                    <Link href={currentSlideData.secondaryButtonLink || '#'}>
                      {currentSlideData.secondaryButtonText}
                    </Link>
                  </Button>
                )}
              </div>

              {/* Features Grid */}
              {currentSlideData.features && (
                <div className="animate-in slide-in-from-left duration-700 delay-900">
                  <div className="grid grid-cols-2 gap-3">
                    {currentSlideData.features.map((feature, index) => (
                      <div
                        key={index}
                        className={cn(
                          'flex items-center space-x-3 rounded-xl p-3 backdrop-blur-sm border',
                          currentColors.glass
                        )}
                      >
                        <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className={cn('font-medium', currentColors.text)}>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats & Trust Section */}
          <div className="lg:pl-8">
            <div className="animate-in slide-in-from-right duration-700 delay-500">
              {/* Stats Card */}
              <div className={cn(
                'rounded-3xl p-8 backdrop-blur-xl border shadow-2xl mb-8',
                currentColors.glass
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'h-12 w-12 rounded-2xl flex items-center justify-center bg-gradient-to-br',
                      currentColors.accent
                    )}>
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className={cn('text-xl font-bold', currentColors.text)}>
                        Market Leader
                      </h3>
                      <p className={cn('text-sm', currentColors.textSecondary)}>
                        Trusted by professionals
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className={cn('text-2xl font-bold', currentColors.text)}>
                      {currentSlideData.stats?.customers}
                    </div>
                    <div className={cn('text-xs font-medium', currentColors.textSecondary)}>
                      Active Customers
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn('text-2xl font-bold', currentColors.text)}>
                      {currentSlideData.stats?.products}
                    </div>
                    <div className={cn('text-xs font-medium', currentColors.textSecondary)}>
                      Premium Products
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={cn('text-2xl font-bold', currentColors.text)}>
                      {currentSlideData.stats?.rating}
                    </div>
                    <div className={cn('text-xs font-medium', currentColors.textSecondary)}>
                      Average Rating
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="space-y-4">
                  {[
                    { icon: '🚚', title: 'Enterprise Delivery', desc: 'Priority logistics network' },
                    { icon: '🔐', title: 'Security Certified', desc: 'SOC 2 Type II compliant' },
                    { icon: '👥', title: 'Dedicated Support', desc: '24/7 professional assistance' },
                    { icon: '🌍', title: 'Global Reach', desc: 'Worldwide shipping available' }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 bg-gradient-to-br',
                        currentColors.accent
                      )}>
                        <span className="text-lg">{item.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className={cn('font-semibold text-sm', currentColors.text)}>
                          {item.title}
                        </div>
                        <div className={cn('text-xs', currentColors.textSecondary)}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
                {/* Rating Section */}
                <div className={cn(
                  'rounded-2xl p-6 backdrop-blur-xl border',
                  currentColors.glass
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className={cn('font-bold text-lg', currentColors.text)}>
                        {currentSlideData.stats?.rating}/5
                      </div>
                    </div>
                    <div className={cn('text-sm', currentColors.textSecondary)}>
                      Based on 12,000+ reviews
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        </div>
    </section>
  );
}

// Enhanced Check Icon Component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.5}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}