// src/components/home/category-grid.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Zap,
  Sparkles,
  Package,
  Eye,
  Heart,
  Grid3X3,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Category, ApiError } from '@/types';
import { cn } from '@/lib/utils';

// Enhanced fallback categories with modern styling
const fallbackCategories = [
  {
    _id: '1',
    name: 'Electronics',
    slug: 'electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop',
    productCount: 1250,
    description: 'Latest gadgets and smart tech',
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    icon: '💻',
    featured: true,
    trending: true,
    discount: '25%',
    popularProducts: ['iPhone 15', 'MacBook Pro', 'AirPods'],
    isActive: true,
    children: [],
    level: 0,
    sort: 1,
    seo: {
      title: 'Electronics',
      description: 'Latest gadgets and smart tech',
      keywords: ['electronics', 'gadgets', 'tech']
    }
  },
  {
    _id: '2',
    name: 'Fashion',
    slug: 'fashion',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
    productCount: 890,
    description: 'Trendy clothing & accessories',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    icon: '👕',
    featured: true,
    trending: false,
    discount: '40%',
    popularProducts: ['Nike Sneakers', 'Summer Dresses', 'Designer Bags'],
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
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
    productCount: 567,
    description: 'Transform your living space',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    icon: '🏠',
    featured: false,
    trending: true,
    discount: '30%',
    popularProducts: ['Smart Lighting', 'Garden Tools', 'Furniture'],
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
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    productCount: 423,
    description: 'Gear for active lifestyle',
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    icon: '⚽',
    featured: false,
    trending: false,
    discount: '35%',
    popularProducts: ['Running Shoes', 'Yoga Mats', 'Camping Gear'],
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
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    productCount: 234,
    description: 'Knowledge & entertainment',
    gradient: 'from-purple-500 via-violet-500 to-indigo-500',
    icon: '📚',
    featured: false,
    trending: false,
    discount: '20%',
    popularProducts: ['Bestsellers', 'E-readers', 'Audiobooks'],
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
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop',
    productCount: 345,
    description: 'Self-care essentials',
    gradient: 'from-teal-500 via-cyan-500 to-blue-500',
    icon: '💄',
    featured: false,
    trending: true,
    discount: '45%',
    popularProducts: ['Skincare Sets', 'Makeup Kits', 'Wellness Products'],
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
  icon?: string;
  featured?: boolean;
  trending?: boolean;
  discount?: string;
  popularProducts?: string[];
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
          icon: fallbackCategories[index]?.icon || '📦',
          featured: index < 2, // Make first 2 categories featured
          trending: index % 3 === 0, // Make every 3rd category trending
          discount: fallbackCategories[index]?.discount || '20%',
          popularProducts: fallbackCategories[index]?.popularProducts || [],
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

  // Enhanced loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl w-64 mx-auto"></div>
        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl w-96 mx-auto"></div>
      </div>
      
      {/* Featured categories skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="relative">
            <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 h-80 md:h-96 rounded-3xl"></div>
            <div className="absolute bottom-6 left-6 space-y-3">
              <div className="h-6 bg-white/50 rounded-xl w-32"></div>
              <div className="h-8 bg-white/50 rounded-xl w-48"></div>
              <div className="h-4 bg-white/50 rounded-lg w-36"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Regular categories skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 h-64 rounded-2xl"></div>
        ))}
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Grid3X3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100">
              Shop by Category
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Discover amazing products across all categories
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200">
                Demo Mode Active
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-sm">
                Showing sample categories with enhanced features
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Featured Categories - Hero Cards */}
      {featuredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredCategories.map((category, index) => (
            <Card 
              key={category._id} 
              className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-slate-800"
              style={{
                animationDelay: `${index * 200}ms`,
                animation: 'fadeInUp 0.8s ease-out forwards'
              }}
            >
              <Link href={`/categories/${category.slug}`}>
                <div className="relative h-80 md:h-96 overflow-hidden">
                  {/* Background Image */}
                  <div className="relative w-full h-full">
                    <Image
                      src={category.image || fallbackCategories[index]?.image || ''}
                      alt={category.name}
                      fill
                      className="object-cover transition-all duration-700 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-t opacity-70 group-hover:opacity-80 transition-opacity duration-500',
                    category.gradient || 'from-black/60 via-black/20 to-transparent'
                  )} />
                  
                  {/* Floating Elements */}
                  <div className="absolute top-6 right-6 flex flex-col space-y-3">
                    {category.trending && (
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none shadow-lg animate-pulse">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none shadow-lg">
                      <Zap className="w-3 h-3 mr-1" />
                      {category.discount} OFF
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <div className="space-y-4 group-hover:-translate-y-2 transition-transform duration-500">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border border-white/30">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-3xl md:text-4xl font-black mb-2">
                          {category.name}
                        </h3>
                        <p className="text-lg opacity-90 mb-4">
                          {category.description}
                        </p>
                      </div>

                      {/* Popular Products */}
                      {category.popularProducts && category.popularProducts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold opacity-80">Popular items:</p>
                          <div className="flex flex-wrap gap-2">
                            {category.popularProducts.slice(0, 3).map((product, idx) => (
                              <Badge 
                                key={idx}
                                variant="outline" 
                                className="bg-white/10 backdrop-blur-sm text-white border-white/30 text-xs"
                              >
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats & CTA */}
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{(category.productCount || 0).toLocaleString()}</div>
                            <div className="text-xs opacity-80">Products</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30 group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                          <span className="font-bold">Shop Now</span>
                          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
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

      {/* Regular Categories - Compact Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {regularCategories.map((category, index) => (
          <Card 
            key={category._id} 
            className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-500 bg-white dark:bg-slate-800 hover:-translate-y-2"
            style={{
              animationDelay: `${(index + 2) * 150}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <Link href={`/categories/${category.slug}`}>
              <div className="relative h-64 overflow-hidden">
                {/* Background Image */}
                <div className="relative w-full h-full">
                  <Image
                    src={category.image || fallbackCategories[index + 2]?.image || ''}
                    alt={category.name}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                
                {/* Gradient Overlay */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-t opacity-60 group-hover:opacity-75 transition-opacity duration-300',
                  category.gradient || 'from-black/70 via-black/20 to-transparent'
                )} />
                
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col space-y-2">
                  {category.trending && (
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none text-xs">
                      🔥 Hot
                    </Badge>
                  )}
                  {category.discount && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-none text-xs">
                      {category.discount} OFF
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-4 flex flex-col justify-end text-white">
                  <div className="space-y-3 group-hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-lg">{category.icon}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm opacity-90 mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <div className="font-semibold">{(category.productCount || 0).toLocaleString()}+</div>
                        <div className="opacity-75">items</div>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg group-hover:bg-white/30 transition-colors duration-300">
                        <Eye className="h-3 w-3" />
                        <span className="text-xs font-semibold">View</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* Enhanced View All Categories Button */}
      <div className="text-center pt-8">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-3xl p-8 border border-slate-200/50 dark:border-slate-700/50">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Package className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Explore All Categories
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Discover thousands of products across all departments
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                asChild 
                className="group h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Link href="/categories">
                  <Grid3X3 className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  View All Categories
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1 duration-300" />
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                asChild
                className="h-12 px-8 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300 group"
              >
                <Link href="/deals">
                  <Heart className="mr-3 h-5 w-5 group-hover:scale-110 group-hover:text-red-500 transition-all duration-300" />
                  Browse Deals
                </Link>
              </Button>
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