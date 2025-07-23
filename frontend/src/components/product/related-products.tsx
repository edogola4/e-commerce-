// src/components/product/related-products.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { Product } from '@/types';

interface RelatedProductsProps {
  productId: string;
}

export function RelatedProducts({ productId }: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId]);

  const fetchRelatedProducts = async () => {
    try {
      const response = await api.recommendations.getSimilarProducts(productId);
      setRelatedProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch related products:', error);
    } finally {
      setLoading(false);
    }
  };

  const itemsToShow = 4;
  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < relatedProducts.length - itemsToShow;

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentIndex(prev => Math.max(0, prev - 1));
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentIndex(prev => Math.min(relatedProducts.length - itemsToShow, prev + 1));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Related Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="skeleton h-48 w-full rounded-lg" />
                <div className="space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-6 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Related Products</CardTitle>
          {relatedProducts.length > itemsToShow && (
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={scrollLeft}
                disabled={!canScrollLeft}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={scrollRight}
                disabled={!canScrollRight}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
              width: `${(relatedProducts.length / itemsToShow) * 100}%`
            }}
          >
            {relatedProducts.map((product) => (
              <div 
                key={product._id} 
                className="flex-shrink-0 px-2"
                style={{ width: `${100 / relatedProducts.length}%` }}
              >
                <ProductCard 
                  product={product} 
                  size="sm"
                  showQuickActions={true}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

