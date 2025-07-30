// src/components/home/hero-section.tsx

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
  Gift
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
  badge?: string;
  badgeColor?: string;
  backgroundColor: string;
  textColor: string;
  features?: string[];
  discount?: string;
  originalPrice?: string;
  salePrice?: string;
}

const heroSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'Latest Electronics',
    subtitle: 'Up to 50% Off',
    description: 'Discover cutting-edge technology with our exclusive deals on smartphones, laptops, and smart home devices.',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop',
    buttonText: 'Shop Electronics',
    buttonLink: '/categories/electronics',
    badge: 'Hot Deal 🔥',
    badgeColor: 'from-red-500 to-orange-500',
    backgroundColor: 'from-blue-600 via-purple-600 to-indigo-600',
    textColor: 'text-white',
    features: ['Free Shipping', '2-Year Warranty', 'Expert Support'],
    discount: '50%',
    originalPrice: 'KES 50,000',
    salePrice: 'KES 25,000',
  },
  {
    id: '2',
    title: 'Fashion Forward',
    subtitle: 'New Season Collection',
    description: 'Step into style with our latest fashion collection featuring trendy designs and premium quality materials.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    buttonText: 'Explore Fashion',
    buttonLink: '/categories/fashion',
    badge: 'New Arrival ✨',
    badgeColor: 'from-pink-500 to-purple-500',
    backgroundColor: 'from-pink-500 via-rose-500 to-red-500',
    textColor: 'text-white',
    features: ['Premium Materials', 'Trendy Designs', 'Size Guide'],
    discount: '30%',
    originalPrice: 'KES 8,000',
    salePrice: 'KES 5,600'
  },
  {
    id: '3',
    title: 'Home & Garden',
    subtitle: 'Transform Your Space',
    description: 'Create your perfect living space with our curated collection of home decor and garden essentials.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    buttonText: 'Shop Home',
    buttonLink: '/categories/home-garden',
    badge: 'Best Seller 🏆',
    badgeColor: 'from-green-500 to-emerald-500',
    backgroundColor: 'from-green-500 via-teal-500 to-cyan-500',
    textColor: 'text-white',
    features: ['Eco-Friendly', 'Easy Assembly', 'Style Guide'],
    discount: '40%',
    originalPrice: 'KES 15,000',
    salePrice: 'KES 9,000'
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide((current) => (current + 1) % heroSlides.length);
          return 0;
        }
        return prev + 2; // 5 seconds total (100 / 2 = 50 intervals * 100ms)
      });
    }, 100);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentSlide]);

  const currentSlideData = heroSlides[currentSlide];

  return (
    <section className="relative min-h-[80vh] lg:min-h-[90vh] overflow-hidden">
      {/* Animated Background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br transition-all duration-1000', currentSlideData.backgroundColor)}>
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-ping delay-500"></div>
      </div>
      
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 scale-110 transition-transform duration-1000"
          style={{ transform: `translateX(${currentSlide * -2}px)` }}
        >
          <Image
            src={currentSlideData.image}
            alt={currentSlideData.title}
            fill
            className="object-cover opacity-30"
            priority={currentSlide === 0}
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full min-h-[80vh] lg:min-h-[90vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="lg:col-span-7 space-y-8">
            {/* Badge with animation */}
            {currentSlideData.badge && (
              <div className="animate-in slide-in-from-left duration-700 delay-200">
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'px-4 py-2 text-sm font-bold bg-gradient-to-r text-white border-none shadow-lg animate-pulse',
                    currentSlideData.badgeColor || 'from-blue-500 to-purple-500'
                  )}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {currentSlideData.badge}
                </Badge>
              </div>
            )}
            
            {/* Main Content */}
            <div className="space-y-6 animate-in slide-in-from-left duration-700 delay-300">
              <div className="space-y-4">
                <h1 className={cn(
                  'text-5xl lg:text-7xl font-black leading-tight bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent',
                  currentSlideData.textColor
                )}>
                  {currentSlideData.title}
                </h1>
                <p className={cn(
                  'text-2xl lg:text-3xl font-bold opacity-90 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent'
                )}>
                  {currentSlideData.subtitle}
                </p>
                <p className={cn(
                  'text-lg lg:text-xl opacity-90 max-w-2xl leading-relaxed',
                  currentSlideData.textColor
                )}>
                  {currentSlideData.description}
                </p>
              </div>

              {/* Price Display */}
              {currentSlideData.discount && (
                <div className="flex items-center space-x-4 animate-in slide-in-from-left duration-700 delay-500">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/30">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-3xl font-black text-white">{currentSlideData.discount}</div>
                        <div className="text-sm text-white/80">OFF</div>
                      </div>
                      <div className="border-l border-white/30 pl-4">
                        <div className="text-lg line-through text-white/60">{currentSlideData.originalPrice}</div>
                        <div className="text-2xl font-bold text-yellow-300">{currentSlideData.salePrice}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-left duration-700 delay-700">
                <Button 
                  size="lg" 
                  asChild 
                  className="group h-14 px-8 bg-white text-slate-900 hover:bg-white/90 font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  <Link href={currentSlideData.buttonLink}>
                    <ShoppingBag className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
                    {currentSlideData.buttonText}
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1 duration-300" />
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild 
                  className="h-14 px-8 bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-semibold text-lg rounded-2xl backdrop-blur-sm hover:scale-105 transition-all duration-300"
                >
                  <Link href="/deals">
                    <Gift className="mr-3 h-5 w-5" />
                    View All Deals
                  </Link>
                </Button>
              </div>

              {/* Features List */}
              {currentSlideData.features && (
                <div className="animate-in slide-in-from-left duration-700 delay-900">
                  <div className="flex flex-wrap gap-3">
                    {currentSlideData.features.map((feature, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20"
                      >
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 pt-4 animate-in slide-in-from-left duration-700 delay-1100">
                <div className="flex items-center space-x-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="text-white">
                    <div className="font-bold">4.8/5</div>
                    <div className="text-sm opacity-80">Customer Rating</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Truck className="h-6 w-6 text-green-400" />
                  <div className="text-white">
                    <div className="font-bold">Free Shipping</div>
                    <div className="text-sm opacity-80">Orders KES 1,000+</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-blue-400" />
                  <div className="text-white">
                    <div className="font-bold">Secure Payment</div>
                    <div className="text-sm opacity-80">SSL Protected</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Showcase */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="animate-in slide-in-from-right duration-700 delay-500">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="h-12 w-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className={cn('text-2xl font-bold', currentSlideData.textColor)}>
                        Why Choose ECommercy?
                      </h3>
                      <p className="text-white/80">Premium shopping experience</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {[
                      { icon: '🚚', title: 'Fast & Free Delivery', desc: 'Same-day delivery in Nairobi' },
                      { icon: '🔒', title: 'Secure Payment', desc: 'Bank-level security & encryption' },
                      { icon: '💎', title: 'Premium Quality', desc: 'Handpicked products & brands' },
                      { icon: '🎯', title: 'AI-Powered Recommendations', desc: 'Personalized just for you' },
                    ].map((item, index) => (
                      <div 
                        key={index}
                        className="group flex items-center space-x-4 p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
                        style={{ animationDelay: `${(index + 1) * 200}ms` }}
                      >
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <span className="text-2xl">{item.icon}</span>
                        </div>
                        <div className="flex-1">
                          <span className={cn('font-bold block', currentSlideData.textColor)}>
                            {item.title}
                          </span>
                          <span className="text-white/70 text-sm">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">50K+</div>
                      <div className="text-xs text-white/70">Happy Customers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">1M+</div>
                      <div className="text-xs text-white/70">Products</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black text-white">24/7</div>
                      <div className="text-xs text-white/70">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx>{`
        @keyframes Check {
          0% { transform: scale(0) rotate(45deg); }
          50% { transform: scale(1.2) rotate(45deg); }
          100% { transform: scale(1) rotate(45deg); }
        }
        
        .animate-check {
          animation: Check 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
}

// Check component for features
function Check({ className }: { className?: string }) {
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
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}