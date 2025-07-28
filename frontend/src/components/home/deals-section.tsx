'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Clock, 
  Flame, 
  Tag, 
  ArrowRight, 
  Zap,
  Sparkles,
  Star,
  TrendingUp,
  Gift,
  AlertTriangle,
  RefreshCw,
  Package,
  Timer,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { Product, ApiError } from '@/types';
import { cn } from '@/lib/utils';

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
  const LoadingSkeleton = () => (
    <section className="w-full relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 via-orange-50/90 to-yellow-50/90 dark:from-red-950/90 dark:via-orange-950/90 dark:to-yellow-950/90"></div>
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          {/* Header Skeleton */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl animate-pulse">
              <Flame className="w-7 h-7" />
              <span className="font-black text-xl">Loading Flash Deals...</span>
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse rounded-2xl w-80 mx-auto"></div>
            <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse rounded-xl w-96 mx-auto"></div>
          </div>

          {/* Countdown Skeleton */}
          <div className="flex justify-center mb-16">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-pulse">
              <CardContent className="p-8">
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-3">
                    <Timer className="w-6 h-6 text-white" />
                    <span className="font-bold text-white text-lg">Loading countdown...</span>
                  </div>
                  <div className="flex space-x-6">
                    {['Hours', 'Minutes', 'Seconds'].map((label, i) => (
                      <div key={i} className="text-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[5rem] border border-white/30">
                          <div className="text-3xl font-black text-white">--</div>
                        </div>
                        <div className="text-sm mt-2 text-white/80 font-medium">{label}</div>
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
              <div 
                key={index} 
                className="relative group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                <div className="absolute -top-3 -right-3 z-10">
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl px-4 py-2 animate-pulse">
                    <span className="text-white font-bold text-sm">🔥 Loading...</span>
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
                  <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 aspect-square rounded-2xl mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl w-3/4"></div>
                    <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-1/2"></div>
                    <div className="h-7 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl w-1/3"></div>
                    <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Enhanced Error state
  if (error) {
    return (
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 via-orange-50/90 to-yellow-50/90 dark:from-red-950/90 dark:via-orange-950/90 dark:to-yellow-950/90"></div>
        </div>
        
        <div className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <div className="max-w-lg mx-auto">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-orange-500 animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  Deals Currently Unavailable
                </h3>
                <p className="text-red-600 dark:text-red-400 mb-8 leading-relaxed">{error}</p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={fetchDeals} 
                    className="group h-12 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                  >
                    <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                    Try Again
                  </Button>
                  <Button 
                    asChild 
                    variant="outline"
                    className="h-12 px-6 border-2 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-300"
                  >
                    <Link href="/products">
                      <Package className="mr-2 h-5 w-5" />
                      Browse All Products
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Enhanced No deals state
  if (!dealProducts || dealProducts.length === 0) {
    return (
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 via-orange-50/90 to-yellow-50/90 dark:from-red-950/90 dark:via-orange-950/90 dark:to-yellow-950/90"></div>
        </div>
        
        <div className="relative z-10 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <div className="max-w-lg mx-auto">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                    <Target className="w-12 h-12 text-orange-500" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500 animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  No Active Deals Right Now
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Don't worry! Amazing deals are coming soon. Check back later or explore our full product catalog.
                </p>
                
                <Button 
                  asChild 
                  className="h-12 px-8 bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                  <Link href="/products">
                    <Package className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Browse All Products
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/90 via-orange-50/90 to-yellow-50/90 dark:from-red-950/90 dark:via-orange-950/90 dark:to-yellow-950/90"></div>
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl animate-ping delay-500"></div>
      </div>

      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          {/* Enhanced Section Header */}
          <div className="text-center mb-16 animate-in slide-in-from-top duration-700">
            <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-4 rounded-2xl mb-8 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <Flame className="w-7 h-7 animate-pulse group-hover:scale-125 transition-transform duration-300" />
              <span className="font-black text-xl">Flash Deals</span>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-5 h-5 animate-spin" />
                <Zap className="w-5 h-5" />
              </div>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent leading-tight">
              Limited Time Offers
            </h2>
            <p className="text-slate-700 dark:text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
              Don't miss out! These incredible deals are flying off the shelves. 
              <span className="font-semibold text-red-600 dark:text-red-400"> Act fast before they're gone forever!</span>
            </p>
          </div>

          {/* Enhanced Countdown Timer */}
          <div className="flex justify-center mb-16 animate-in slide-in-from-bottom duration-700 delay-300">
            <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-500 group">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                      <Timer className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <span className="font-bold text-black text-lg block">Deals End In:</span>
                      <span className="text-black/80 text-sm">Don't wait too long!</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    {[
                      { value: timeLeft.hours, label: 'Hours' },
                      { value: timeLeft.minutes, label: 'Minutes' },
                      { value: timeLeft.seconds, label: 'Seconds' }
                    ].map((item, index) => (
                      <div key={index} className="text-center group-hover:scale-110 transition-transform duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 min-w-[5rem] border border-white/30 shadow-lg">
                          <div className="text-3xl font-black text-red-600">
                            {item.value.toString().padStart(2, '0')}
                          </div>
                        </div>
                        <div className="text-sm mt-2 text-red-600/80 font-medium">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deal Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: TrendingUp, label: 'Hot Deals', value: dealProducts.length, color: 'from-red-500 to-orange-500' },
              { icon: Star, label: 'Avg Rating', value: '4.8★', color: 'from-yellow-500 to-orange-500' },
              { icon: Tag, label: 'Max Discount', value: '70%', color: 'from-green-500 to-emerald-500' },
              { icon: Timer, label: 'Time Left', value: '24h', color: 'from-blue-500 to-purple-500' },
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="flex items-center space-x-4">
                  <div className={`h-12 w-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stat.value}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {dealProducts.map((product, index) => (
              <div
                key={product._id}
                className="group relative"
                style={{
                  animationDelay: `${index * 150}ms`,
                  animation: 'fadeInUp 0.8s ease-out forwards'
                }}
              >
                {/* Enhanced Deal Badge */}
                <div className="absolute -top-4 -right-4 z-20">
                  <div className="relative">
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-none shadow-xl px-4 py-2 rounded-2xl font-bold animate-pulse">
                      🔥 HOT DEAL
                    </Badge>
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-spin" />
                  </div>
                </div>

                {/* Discount Percentage */}
                <div className="absolute top-4 left-4 z-20">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-xl font-bold text-sm shadow-lg">
                    -{Math.floor(Math.random() * 50 + 20)}%
                  </div>
                </div>

                {/* Product Card Container */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group-hover:bg-white/90 dark:group-hover:bg-slate-800/90">
                  <ProductCard
                    product={product}
                    className="h-full border-0 shadow-none bg-transparent"
                  />
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl"></div>
              </div>
            ))}
          </div>

          {/* Enhanced View All Section */}
          <div className="text-center animate-in slide-in-from-bottom duration-700 delay-500">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl max-w-2xl mx-auto">
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3">
                  <Gift className="h-10 w-10 text-orange-500" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      More Amazing Deals Await!
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      Discover hundreds of discounted products
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    asChild 
                    className="group h-14 px-8 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-2xl"
                  >
                    <Link href="/deals">
                      <Flame className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform duration-300" />
                      View All Deals
                      <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1 duration-300" />
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    asChild
                    className="h-14 px-8 border-2 border-white/30 text-slate-700 dark:text-slate-300 hover:bg-white/20 font-semibold text-lg rounded-2xl backdrop-blur-sm transition-all duration-300 group"
                  >
                    <Link href="/categories">
                      <Package className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      Browse Categories
                    </Link>
                  </Button>
                </div>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>{dealProducts.length} deals available</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Timer className="h-4 w-4" />
                    <span>Limited time only</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Star className="h-4 w-4 fill-current text-yellow-500" />
                    <span>Top rated products</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}