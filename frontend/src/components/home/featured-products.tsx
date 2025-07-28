// src/components/home/featured-products.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  Star,
  Crown,
  Award,
  Eye,
  Heart,
  Package,
  AlertCircle,
  RefreshCw,
  Zap,
  Target,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { Product, ApiError } from '@/types';
import { cn } from '@/lib/utils';

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'top-rated' | 'new'>('all');

  useEffect(() => {
    fetchFeaturedProducts();
  }, [activeFilter]);

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the getFeaturedProducts method or getProducts with proper filters
      let response;
      
      // Try the specific getFeaturedProducts method first
      if (api.products.getFeaturedProducts) {
        response = await api.products.getFeaturedProducts(8);
      } else {
        // Fallback to general getProducts with cleaned parameters
        response = await api.products.getProducts({ 
          featured: true, 
          limit: 8,
          isActive: true,
          sort: '-createdAt' // Show newest featured products first
        });
      }
      
      console.log('Featured Products API Response:', response);
      
      // Handle different response structures
      const products = response?.data || response || [];
      
      // Ensure we have an array
      if (Array.isArray(products)) {
        setFeaturedProducts(products);
      } else {
        console.warn('Featured products API response is not an array:', products);
        setFeaturedProducts([]);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch featured products:', error);
      
      // Handle API errors gracefully
      if (error?.statusCode === 400) {
        setError('Unable to load featured products at the moment.');
      } else {
        setError(error?.message || 'Failed to load featured products');
      }
      
      setFeaturedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOptions = [
    { id: 'all', label: 'All Featured', icon: Crown, count: featuredProducts.length },
    { id: 'trending', label: 'Trending', icon: TrendingUp, count: Math.floor(featuredProducts.length * 0.4) },
    { id: 'top-rated', label: 'Top Rated', icon: Star, count: Math.floor(featuredProducts.length * 0.3) },
    { id: 'new', label: 'New Arrivals', icon: Sparkles, count: Math.floor(featuredProducts.length * 0.3) },
  ];

  // Enhanced Loading skeleton
  const LoadingSkeleton = () => (
    <div className="w-full space-y-12">
      {/* Section Header Skeleton */}
      <div className="text-center space-y-6 animate-pulse">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl h-12 w-48 mx-auto"></div>
        <div className="h-14 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl w-80 mx-auto"></div>
        <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl w-96 mx-auto"></div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex justify-center">
        <div className="flex space-x-3 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl h-12 w-32 animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Products Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[...Array(8)].map((_, index) => (
          <div 
            key={index} 
            className="group relative"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg">
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
  );

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Enhanced Error state
  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-20">
          <div className="max-w-lg mx-auto">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-orange-500 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Oops! Something went wrong
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-8 leading-relaxed">{error}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={fetchFeaturedProducts} 
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
    );
  }

  // Enhanced No products state
  if (!featuredProducts || featuredProducts.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-20">
          <div className="max-w-lg mx-auto">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <Target className="w-12 h-12 text-blue-500" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-purple-500 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              No Featured Products Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              We're working on curating amazing products for you. Check back soon for our top picks!
            </p>
            
            <Button 
              asChild 
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
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
    );
  }

  return (
    <div className="w-full space-y-12">
      {/* Enhanced Section Header */}
      <div className="text-center space-y-6 animate-in slide-in-from-top duration-700">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-sm">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Crown className="w-4 text-white" />
          </div>
          <span className="font-bold text-lg">Featured Products</span>
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
            Hand-Picked for You
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Discover our carefully curated collection of products that our customers love most. 
            <span className="font-semibold text-blue-600 dark:text-blue-400"> Quality guaranteed.</span>
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center animate-in slide-in-from-bottom duration-700 delay-200">
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex space-x-2">
            {filterOptions.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={cn(
                  "group flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-300 font-semibold",
                  activeFilter === filter.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700"
                )}
              >
                <filter.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                <span>{filter.label}</span>
                <Badge 
                  variant={activeFilter === filter.id ? "secondary" : "outline"}
                  className={cn(
                    "text-xs",
                    activeFilter === filter.id 
                      ? "bg-white/20 text-white border-white/30" 
                      : "bg-slate-200 dark:bg-slate-600"
                  )}
                >
                  {filter.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-700 delay-300">
        {[
          { icon: Award, label: 'Featured Items', value: featuredProducts.length, color: 'from-blue-500 to-purple-600' },
          { icon: Star, label: 'Avg Rating', value: '4.9★', color: 'from-yellow-500 to-orange-500' },
          { icon: TrendingUp, label: 'Top Seller', value: '95%', color: 'from-green-500 to-emerald-600' },
          { icon: Eye, label: 'Most Viewed', value: '10K+', color: 'from-pink-500 to-red-500' },
        ].map((stat, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {featuredProducts.map((product, index) => (
          <div
            key={product._id}
            className="group relative"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.8s ease-out forwards'
            }}
          >
            {/* Featured Badge */}
            <div className="absolute -top-3 -right-3 z-20">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none shadow-lg px-3 py-1 rounded-2xl font-bold">
                <Star className="w-3 h-3 mr-1 fill-current" />
                Featured
              </Badge>
            </div>

            {/* Popularity Indicator */}
            <div className="absolute top-4 left-4 z-20">
              <div className="flex items-center space-x-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-3 py-1 rounded-xl border border-white/50 shadow-md">
                <Heart className="w-3 h-3 text-red-500 fill-current" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {Math.floor(Math.random() * 1000 + 100)}
                </span>
              </div>
            </div>

            {/* Product Card Container */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group-hover:bg-slate-50 dark:group-hover:bg-slate-750">
              <ProductCard
                product={product}
                className="h-full border-0 shadow-none bg-transparent"
              />
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl"></div>
          </div>
        ))}
      </div>

      {/* Enhanced View All Section */}
      <div className="text-center animate-in slide-in-from-bottom duration-700 delay-500">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50 shadow-lg max-w-2xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Discover More Premium Products
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Explore our complete featured collection
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg"
                className="group h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-2xl"
              >
                <Link href="/products?featured=true">
                  <TrendingUp className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform duration-300" />
                  View All Featured Products
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1 duration-300" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                asChild
                className="h-14 px-8 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300 group"
              >
                <Link href="/categories">
                  <Filter className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Browse by Category
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-6 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center space-x-2">
                <Award className="h-4 w-4" />
                <span>{featuredProducts.length} curated products</span>
              </span>
              <span className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Updated daily</span>
              </span>
              <span className="flex items-center space-x-2">
                <Star className="h-4 w-4 fill-current text-yellow-500" />
                <span>Premium quality</span>
              </span>
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
    </div>
  );
}