// src/components/home/hero-section.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ShoppingBag, Star, ArrowRight } from 'lucide-react';
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
  backgroundColor: string;
  textColor: string;
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
    badge: 'Hot Deal',
    backgroundColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
    textColor: 'text-white',
  },
  {
    id: '2',
    title: 'Fashion Forward',
    subtitle: 'New Season Collection',
    description: 'Step into style with our latest fashion collection featuring trendy designs and premium quality materials.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    buttonText: 'Explore Fashion',
    buttonLink: '/categories/fashion',
    badge: 'New Arrival',
    backgroundColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
    textColor: 'text-white',
  },
  {
    id: '3',
    title: 'Home & Garden',
    subtitle: 'Transform Your Space',
    description: 'Create your perfect living space with our curated collection of home decor and garden essentials.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    buttonText: 'Shop Home',
    buttonLink: '/categories/home-garden',
    backgroundColor: 'bg-gradient-to-r from-green-500 to-teal-500',
    textColor: 'text-white',
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const currentSlideData = heroSlides[currentSlide];

  return (
    <section 
      className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Background */}
      <div className={cn('absolute inset-0 transition-all duration-1000', currentSlideData.backgroundColor)} />
      
      {/* Background Image - FIXED: Added proper relative positioning */}
      <div className="absolute inset-0 relative">
        <Image
          src={currentSlideData.image}
          alt={currentSlideData.title}
          fill
          className="object-cover opacity-20"
          priority={currentSlide === 0}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full min-h-[600px] lg:min-h-[700px] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Text Content */}
          <div className={cn('space-y-6 animate-in slide-in-from-left duration-1000', currentSlideData.textColor)}>
            {currentSlideData.badge && (
              <Badge variant="secondary" className="w-fit text-sm font-medium">
                {currentSlideData.badge}
              </Badge>
            )}
            
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {currentSlideData.title}
              </h1>
              <p className="text-xl lg:text-2xl font-semibold opacity-90">
                {currentSlideData.subtitle}
              </p>
              <p className="text-lg opacity-80 max-w-lg leading-relaxed">
                {currentSlideData.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group">
                <Link href={currentSlideData.buttonLink}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {currentSlideData.buttonText}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" asChild className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Link href="/deals">
                  View All Deals
                </Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm opacity-80">4.8/5 Customer Rating</span>
              </div>
              <div className="text-sm opacity-80">
                Free Shipping on Orders KES 1,000+
              </div>
            </div>
          </div>

          {/* Product showcase or additional content */}
          <div className="hidden lg:block animate-in slide-in-from-right duration-1000">
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className={cn('text-2xl font-bold mb-4', currentSlideData.textColor)}>
                  Why Choose ECommercy?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🚚</span>
                    </div>
                    <span className={cn('font-medium', currentSlideData.textColor)}>
                      Fast & Free Delivery
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🔒</span>
                    </div>
                    <span className={cn('font-medium', currentSlideData.textColor)}>
                      Secure Payment
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">💎</span>
                    </div>
                    <span className={cn('font-medium', currentSlideData.textColor)}>
                      Premium Quality
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">🎯</span>
                    </div>
                    <span className={cn('font-medium', currentSlideData.textColor)}>
                      AI-Powered Recommendations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute inset-y-0 left-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSlide}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSlide}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div 
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ 
            width: isAutoPlay ? `${((currentSlide + 1) / heroSlides.length) * 100}%` : '0%' 
          }}
        />
      </div>
    </section>
  );
}