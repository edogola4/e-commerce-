// src/components/search/search-results.tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/product/product-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Grid, 
  List, 
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Filter,
  ArrowRight,
  Package,
  Eye,
  ShoppingBag,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  products: Product[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  query: string;
  totalResults: number;
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  appliedFiltersCount?: number;
}

export function SearchResults({ 
  products, 
  loading, 
  viewMode, 
  query, 
  totalResults,
  onViewModeChange,
  appliedFiltersCount = 0
}: SearchResultsProps) {
  const [animationDelay, setAnimationDelay] = useState(0);

  useEffect(() => {
    setAnimationDelay(0);
  }, [products, viewMode]);

  // Loading skeleton component
  const LoadingSkeleton = ({ index }: { index: number }) => (
    <div 
      className={cn(
        "group relative",
        viewMode === 'grid' ? "space-y-4" : "flex space-x-4 p-4"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      <div className={cn(
        "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl",
        viewMode === 'grid' ? "aspect-square w-full" : "w-48 h-32 flex-shrink-0"
      )} />
      <div className={cn(
        "space-y-3",
        viewMode === 'list' && "flex-1"
      )}>
        <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-3/4" />
        <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-1/2" />
        <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-1/3" />
        {viewMode === 'list' && (
          <>
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-full" />
            <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-4/5" />
          </>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl animate-pulse" />
            <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg animate-pulse" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-10 w-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Loading grid/list */}
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
        )}>
          {[...Array(12)].map((_, index) => (
            <LoadingSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-2xl bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
            {/* Animated empty state icon */}
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <Search className="h-16 w-16 text-blue-400 relative z-10 group-hover:scale-110 group-hover:text-blue-500 transition-all duration-300" />
                <div className="absolute top-4 right-4 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-4 left-4 w-3 h-3 bg-gradient-to-br from-pink-400 to-red-400 rounded-full animate-ping"></div>
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500 animate-pulse" />
            </div>

            <div className="space-y-4 max-w-lg">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {query ? 'No matches found' : 'No products found'}
              </h3>
              
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {query 
                  ? (
                    <>
                      No results found for <span className="font-semibold text-slate-900 dark:text-slate-100">"{query}"</span>. 
                      Try adjusting your search terms or filters to discover more products.
                    </>
                  )
                  : 'Try adjusting your filters or search terms to find what you\'re looking for.'
                }
              </p>

              {appliedFiltersCount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {appliedFiltersCount} filter{appliedFiltersCount > 1 ? 's' : ''} active
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Try removing some filters to see more results
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-md">
              <Button 
                asChild
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <a href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Browse All Products
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </Button>
              
              <Button 
                variant="outline"
                asChild
                className="flex-1 h-12 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300 group"
              >
                <a href="/categories">
                  <Package className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                  Explore Categories
                </a>
              </Button>
            </div>

            {/* Search suggestions */}
            <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/50 dark:border-green-800/50 w-full max-w-md">
              <div className="flex items-center space-x-3 mb-3">
                <Lightbulb className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-green-800 dark:text-green-200">Search Tips</h4>
              </div>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Try different keywords or synonyms</li>
                <li>• Check your spelling</li>
                <li>• Use fewer or more specific terms</li>
                <li>• Browse our categories instead</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {totalResults.toLocaleString()} Products Found
              </h2>
              {query && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Results for <span className="font-semibold">"{query}"</span>
                </p>
              )}
            </div>
          </div>
          
          {appliedFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Filter className="h-3 w-3 mr-1" />
              {appliedFiltersCount} filter{appliedFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* View mode toggle */}
        {onViewModeChange && (
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "h-9 px-4 rounded-lg transition-all duration-300",
                viewMode === 'grid' 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "h-9 px-4 rounded-lg transition-all duration-300",
                viewMode === 'list' 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {totalResults > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { 
              icon: TrendingUp, 
              label: 'Trending', 
              value: Math.floor(totalResults * 0.15), 
              color: 'from-green-500 to-emerald-600' 
            },
            { 
              icon: Zap, 
              label: 'On Sale', 
              value: Math.floor(totalResults * 0.25), 
              color: 'from-red-500 to-pink-600' 
            },
            { 
              icon: Star, 
              label: 'Top Rated', 
              value: Math.floor(totalResults * 0.20), 
              color: 'from-yellow-500 to-orange-600' 
            },
            { 
              icon: Clock, 
              label: 'New Arrivals', 
              value: Math.floor(totalResults * 0.10), 
              color: 'from-blue-500 to-purple-600' 
            },
          ].map((stat, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center space-x-3">
                <div className={`h-10 w-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products grid/list */}
      <div className={cn(
        "transition-all duration-500",
        viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-6'
      )}>
        {products.map((product, index) => (
          <div
            key={product._id}
            className="group"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <ProductCard
              product={product}
              size={viewMode === 'grid' ? 'md' : 'lg'}
              showQuickActions={true}
              layout={viewMode}
              className="hover:scale-105 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {/* Load more indicator (if pagination is needed) */}
      {products.length > 0 && products.length < totalResults && (
        <div className="flex justify-center pt-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Showing {products.length} of {totalResults.toLocaleString()} products
              </span>
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group"
            >
              Load More Products
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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