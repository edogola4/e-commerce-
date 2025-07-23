// src/components/home/category-grid.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Category, ApiError } from '@/types';
import { cn } from '@/lib/utils';

// Fallback categories with appealing visuals
const fallbackCategories = [
  {
    _id: '1',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    productCount: 1250,
    description: 'Latest gadgets and tech',
    gradient: 'from-blue-500 to-cyan-500',
    featured: true,
    isActive: true,
    children: [],
    level: 0,
    sort: 1,
    seo: {
      title: 'Electronics',
      description: 'Latest gadgets and tech',
      keywords: ['electronics', 'gadgets', 'tech']
    }
  },
  {
    _id: '2',
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    productCount: 890,
    description: 'Trendy clothing & accessories',
    gradient: 'from-pink-500 to-rose-500',
    featured: true,
    isActive: true,
    children: [],
    level: 0,
    sort: 2,
    seo: {
      title: 'Fashion',
      description: 'Trendy clothing & accessories',
      keywords: ['fashion', 'clothing', 'accessories']
    }
  },
  {
    _id: '3',
    name: 'Home & Garden',
    slug: 'home-garden',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    productCount: 567,
    description: 'Transform your living space',
    gradient: 'from-green-500 to-emerald-500',
    featured: false,
    isActive: true,
    children: [],
    level: 0,
    sort: 3,
    seo: {
      title: 'Home & Garden',
      description: 'Transform your living space',
      keywords: ['home', 'garden', 'decor']
    }
  },
  {
    _id: '4',
    name: 'Sports & Outdoors',
    slug: 'sports',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    productCount: 423,
    description: 'Gear for active lifestyle',
    gradient: 'from-orange-500 to-red-500',
    featured: false,
    isActive: true,
    children: [],
    level: 0,
    sort: 4,
    seo: {
      title: 'Sports & Outdoors',
      description: 'Gear for active lifestyle',
      keywords: ['sports', 'outdoors', 'fitness']
    }
  },
  {
    _id: '5',
    name: 'Books & Media',
    slug: 'books',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    productCount: 234,
    description: 'Knowledge & entertainment',
    gradient: 'from-purple-500 to-indigo-500',
    featured: false,
    isActive: true,
    children: [],
    level: 0,
    sort: 5,
    seo: {
      title: 'Books & Media',
      description: 'Knowledge & entertainment',
      keywords: ['books', 'media', 'entertainment']
    }
  },
  {
    _id: '6',
    name: 'Beauty & Health',
    slug: 'beauty-health',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    productCount: 345,
    description: 'Self-care essentials',
    gradient: 'from-teal-500 to-cyan-500',
    featured: false,
    isActive: true,
    children: [],
    level: 0,
    sort: 6,
    seo: {
      title: 'Beauty & Health',
      description: 'Self-care essentials',
      keywords: ['beauty', 'health', 'wellness']
    }
  },
];

// Extended category type for display purposes
interface DisplayCategory extends Category {
  gradient?: string;
  featured?: boolean;
}

export function CategoryGrid() {
  const [categories, setCategories] = useState<DisplayCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.products.getCategories();
      console.log('Categories API Response:', response);
      
      // Handle different response structures
      const categoriesData = response?.data || response || [];
      
      if (Array.isArray(categoriesData) && categoriesData.length > 0) {
        // Map backend categories to display format
        const mappedCategories: DisplayCategory[] = categoriesData.map((cat, index) => ({
          ...cat,
          gradient: fallbackCategories[index]?.gradient || 'from-gray-500 to-gray-600',
          featured: index < 2, // Make first 2 categories featured
        }));
        setCategories(mappedCategories);
      } else {
        console.log('Using fallback categories');
        setCategories(fallbackCategories);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch categories:', error);
      setError(error?.message || 'Failed to load categories');
      // Use fallback categories on error
      setCategories(fallbackCategories);
    } finally {
      setLoading(false);
    }
  };
  
  // Use backend categories if available, otherwise use fallback
  const displayCategories = categories.length > 0 ? categories : fallbackCategories;
  
  // Separate featured and regular categories
  const featuredCategories = displayCategories.filter(cat => cat.featured).slice(0, 2);
  const regularCategories = displayCategories.filter(cat => !cat.featured).slice(0, 4);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Featured categories skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 md:h-80 rounded-lg"></div>
            </div>
          ))}
        </div>
        
        {/* Regular categories skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-40 md:h-48 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Error message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-center">
            {error} (Showing sample categories)
          </p>
        </div>
      )}

      {/* Featured Categories - Large Cards */}
      {featuredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredCategories.map((category, index) => (
            <Card 
              key={category._id} 
              className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href={`/categories/${category.slug}`}>
                <div className="relative h-64 md:h-80">
                  {/* FIXED: Added proper relative positioning */}
                  <div className="relative w-full h-full">
                    <Image
                      src={category.image || fallbackCategories[index]?.image || ''}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-t opacity-60',
                    category.gradient || fallbackCategories[index]?.gradient || 'from-black/50 to-transparent'
                  )} />
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-fit">
                        Featured
                      </Badge>
                      <h3 className="text-2xl md:text-3xl font-bold">
                        {category.name}
                      </h3>
                      <p className="text-sm opacity-90">
                        {category.description || `Explore ${category.name.toLowerCase()}`}
                      </p>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm">
                          {category.productCount || 0}+ products
                        </span>
                        <div className="flex items-center space-x-2 group-hover:translate-x-1 transition-transform">
                          <span className="text-sm font-medium">Shop Now</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Regular Categories - Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {regularCategories.map((category, index) => (
          <Card 
            key={category._id} 
            className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Link href={`/categories/${category.slug}`}>
              <div className="relative h-40 md:h-48">
                {/* FIXED: Added proper relative positioning */}
                <div className="relative w-full h-full">
                  <Image
                    src={category.image || fallbackCategories[index + 2]?.image || ''}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-t opacity-50',
                  category.gradient || fallbackCategories[index + 2]?.gradient || 'from-black/50 to-transparent'
                )} />
                
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                  <h3 className="text-lg font-bold mb-1">
                    {category.name}
                  </h3>
                  <p className="text-xs opacity-90 mb-2">
                    {category.description || `Shop ${category.name.toLowerCase()}`}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">
                      {category.productCount || 0}+
                    </span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* View All Categories Button */}
      <div className="text-center pt-6">
        <Button variant="outline" size="lg" asChild className="group">
          <Link href="/categories">
            View All Categories
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}