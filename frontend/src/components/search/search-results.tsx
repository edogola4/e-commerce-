// src/components/search/search-results.tsx
'use client';

import { ProductCard } from '@/components/product/product-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Grid, List } from 'lucide-react';
import { Product } from '@/types';

interface SearchResultsProps {
  products: Product[];
  loading: boolean;
  viewMode: 'grid' | 'list';
  query: string;
  totalResults: number;
}

export function SearchResults({ 
  products, 
  loading, 
  viewMode, 
  query, 
  totalResults 
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }>
        {[...Array(12)].map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="skeleton h-64 w-full rounded-lg" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-6 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground text-center mb-4">
            {query 
              ? `No results found for "${query}". Try adjusting your search or filters.`
              : 'Try adjusting your filters or search terms.'
            }
          </p>
          <Button asChild>
            <a href="/products">Browse All Products</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
      : 'space-y-4'
    }>
      {products.map((product) => (
        <ProductCard
          key={product._id}
          product={product}
          size={viewMode === 'grid' ? 'md' : 'sm'}
          showQuickActions={true}
        />
      ))}
    </div>
  );
}