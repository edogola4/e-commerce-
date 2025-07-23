// src/components/home/deals-section.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, Flame, Tag, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { Product, ApiError } from '@/types';

export function DealsSection() {
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    fetchDeals();
    
    // Start countdown timer (example: 24 hours from now)
    const targetTime = new Date().getTime() + (24 * 60 * 60 * 1000);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetTime - now;
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the getSaleProducts method or getProducts with proper filters
      let response;
      
      // Try the specific getSaleProducts method first
      if (api.products.getSaleProducts) {
        response = await api.products.getSaleProducts(6);
      } else {
        // Fallback to general getProducts with cleaned parameters
        response = await api.products.getProducts({ 
          onSale: true, 
          limit: 6,
          sort: '-discount', // Use proper sort format
          isActive: true
        });
      }
      
      console.log('Deals API Response:', response);
      
      // Handle different response structures
      const products = response?.data || response || [];
      
      // Ensure we have an array
      if (Array.isArray(products)) {
        setDealProducts(products);
      } else {
        console.warn('API response is not an array:', products);
        setDealProducts([]);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch deals:', error);
      
      // Handle API errors gracefully
      if (error?.statusCode === 400) {
        setError('Unable to load deals at the moment. Please try again later.');
      } else {
        setError(error?.message || 'Failed to load deals');
      }
      
      setDealProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Loading state
  if (loading) {
    return (
      <section className="w-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-16 rounded-3xl">
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full mb-6 shadow-strong">
              <Flame className="w-6 h-6 animate-pulse" />
              <span className="font-bold text-lg">Flash Deals</span>
              <Zap className="w-5 h-5" />
            </div>
            <div className="h-10 bg-gray-200 animate-pulse rounded w-64 mx-auto mb-4"></div>
            <div className="h-6 bg-gray-200 animate-pulse rounded w-96 mx-auto"></div>
          </div>

          {/* Countdown Skeleton */}
          <div className="flex justify-center mb-12">
            <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-strong">
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">Loading deals...</span>
                  </div>
                  <div className="flex space-x-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="text-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[4rem] animate-pulse">
                          <div className="text-2xl font-bold">--</div>
                        </div>
                        <div className="text-xs mt-1 opacity-90">
                          {i === 1 ? 'Hours' : i === 2 ? 'Minutes' : 'Seconds'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-white rounded-lg shadow-medium p-4">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Enhanced Error state
  if (error) {
    return (
      <section className="w-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-16 rounded-3xl">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Deals Currently Unavailable
              </h3>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={fetchDeals} variant="outline" className="mr-4">
                Try Again
              </Button>
              <Button asChild variant="ghost">
                <Link href="/products">Browse All Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Enhanced No deals state
  if (!dealProducts || dealProducts.length === 0) {
    return (
      <section className="w-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-16 rounded-3xl">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Deals
              </h3>
              <p className="text-gray-600 mb-6">
                Check back soon for amazing deals and discounts!
              </p>
              <Button asChild variant="outline">
                <Link href="/products">Browse All Products</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-16 rounded-3xl">
      <div className="container mx-auto px-4">
        {/* Enhanced Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-full mb-6 shadow-strong">
            <Flame className="w-6 h-6 animate-pulse" />
            <span className="font-bold text-lg">Flash Deals</span>
            <Zap className="w-5 h-5" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Limited Time Offers
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto leading-relaxed">
            Grab them before they're gone! These amazing deals won't last long.
          </p>
        </div>

        {/* Enhanced Countdown Timer */}
        <div className="flex justify-center mb-12 animate-slide-up">
          <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-strong">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Ends in:</span>
                </div>
                <div className="flex space-x-4">
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[4rem]">
                      <div className="text-2xl font-bold">
                        {timeLeft.hours.toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-xs mt-1 opacity-90">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[4rem]">
                      <div className="text-2xl font-bold">
                        {timeLeft.minutes.toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-xs mt-1 opacity-90">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 min-w-[4rem]">
                      <div className="text-2xl font-bold">
                        {timeLeft.seconds.toString().padStart(2, '0')}
                      </div>
                    </div>
                    <div className="text-xs mt-1 opacity-90">Seconds</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {dealProducts.map((product, index) => (
            <div
              key={product._id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="relative">
                {/* Deal Badge */}
                <div className="absolute -top-2 -right-2 z-20">
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-strong animate-pulse">
                    🔥 HOT DEAL
                  </Badge>
                </div>
                <div className="bg-white rounded-xl p-2 shadow-medium hover:shadow-strong transition-all duration-300">
                  <ProductCard
                    product={product}
                    className="h-full border-0 shadow-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced View All Button */}
        <div className="text-center animate-fade-in">
          <Button 
            size="lg" 
            asChild 
            className="group bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold px-8 py-4 text-lg shadow-strong hover:shadow-xl transition-all duration-300"
          >
            <Link href="/deals">
              <Flame className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              View All Deals
              <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1 duration-300" />
            </Link>
          </Button>
          <p className="text-sm text-gray-600 mt-4">
            {dealProducts.length} amazing deals available now
          </p>
        </div>
      </div>
    </section>
  );
}