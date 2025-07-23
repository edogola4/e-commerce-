// src/components/home/featured-products.tsx
'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { Product, ApiError } from '@/types';

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

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

  // Loading state with enhanced skeleton
  if (isLoading) {
    return (
      <div className="w-full">
        {/* Section Header Skeleton */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gray-200 animate-pulse rounded-full h-8 w-32 mb-4"></div>
          <div className="h-10 bg-gray-200 animate-pulse rounded w-64 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 animate-pulse rounded w-96 mx-auto"></div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state with better styling
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={fetchFeaturedProducts} variant="outline" className="mr-4">
            Try Again
          </Button>
          <Button asChild variant="ghost">
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No products state with better styling
  if (!featuredProducts || featuredProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📦</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Featured Products Yet
          </h3>
          <p className="text-gray-600 mb-6">
            We're working on curating amazing products for you. Check back soon!
          </p>
          <Button asChild variant="outline">
            <Link href="/products">Browse All Products</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced Section Header */}
      <div className="text-center mb-12 animate-fade-in">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-primary/5 text-primary px-4 py-2 rounded-full mb-6 shadow-soft">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">Featured Products</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
          Hand-Picked for You
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
          Discover our carefully selected products that our customers love most
        </p>
      </div>

      {/* Enhanced Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {featuredProducts.map((product, index) => (
          <div
            key={product._id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ProductCard
              product={product}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* Enhanced View All Button */}
      <div className="text-center mt-16 animate-fade-in">
        <div className="inline-flex flex-col items-center space-y-4">
          <Button 
            variant="outline" 
            size="lg" 
            asChild 
            className="group bg-gradient-to-r from-card to-card/50 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 px-8 py-3 text-lg font-semibold shadow-medium hover:shadow-strong"
          >
            <Link href="/products?featured=true">
              <TrendingUp className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
              View All Featured Products
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 duration-300" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Showing {featuredProducts.length} of our top picks
          </p>
        </div>
      </div>
    </div>
  );
}