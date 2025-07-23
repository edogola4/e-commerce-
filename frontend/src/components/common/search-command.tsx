'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSearch, useLocalStorage } from '@/hooks';
import { Product } from '@/types';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SearchCommandProps {
  query: string;
  onClose: () => void;
  onSelect: (product: Product) => void;
  className?: string;
}

export function SearchCommand({ query, onClose, onSelect, className }: SearchCommandProps) {
  const { results, loading } = useSearch(query, 300);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', []);
  const [popularSearches] = useState([
    'iPhone', 'Samsung Galaxy', 'MacBook', 'Nike Shoes', 'Headphones',
    'Smart Watch', 'Gaming Mouse', 'Bluetooth Speaker'
  ]);

  const addToRecentSearches = useCallback((searchTerm: string) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(term => term !== searchTerm);
      return [searchTerm, ...filtered].slice(0, 10);
    });
  }, [setRecentSearches]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const handleProductSelect = (product: Product) => {
    addToRecentSearches(query);
    onSelect(product);
  };

  if (!query && recentSearches.length === 0) {
    return (
      <Card className={cn('w-full shadow-lg', className)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" />
                Popular Searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <Badge
                    key={term}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => {
                      addToRecentSearches(term);
                      onClose();
                    }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full shadow-lg', className)}>
      <CardContent className="p-0">
        {loading && (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="p-4 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No products found for "{query}"</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try different keywords or browse our categories
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            <div className="p-2">
              <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                Products ({results.length})
              </h3>
              <div className="space-y-1">
                {results.slice(0, 8).map((product) => (
                  <Button
                    key={product._id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-2 hover:bg-muted"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        <Image
                          src={getOptimizedImageUrl(
                            product.images[0]?.url || '/images/placeholder.png',
                            { width: 40, height: 40 }
                          )}
                          alt={product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium line-clamp-1">
                          {product.name}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
              
              {results.length > 8 && (
                <div className="p-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      addToRecentSearches(query);
                      onClose();
                    }}
                  >
                    View all {results.length} results
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <>
            <Separator />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Recent Searches
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecentSearches}
                  className="text-xs h-6 px-2"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <Button
                    key={`${term}-${index}`}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-left"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    <Search className="mr-2 h-3 w-3 text-muted-foreground" />
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}