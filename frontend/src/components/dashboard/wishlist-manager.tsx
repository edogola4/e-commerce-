'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWishlistStore } from '@/store';
import { useCart, useWishlist } from '@/hooks';
import { formatCurrency, getOptimizedImageUrl, calculateDiscountPercentage } from '@/lib/utils';
import { Product } from '@/types';

export function WishlistManager() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  
  const { items } = useWishlistStore();
  const { addToCart } = useCart();
  const { toggleWishlist } = useWishlist();

  const handleAddToCart = async (product: Product) => {
    if (product.stock === 0) return;
    
    setLoadingItems(prev => new Set(prev).add(product._id));
    try {
      await addToCart(product._id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setLoadingItems(prev => {
        const updated = new Set(prev);
        updated.delete(product._id);
        return updated;
      });
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await toggleWishlist(productId, true);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const handleAddAllToCart = async () => {
    const availableItems = items.filter(item => {
      const product = typeof item.product === 'object' ? item.product : null;
      return product && product.stock > 0;
    });

    for (const item of availableItems) {
      const product = typeof item.product === 'object' ? item.product : null;
      if (product) {
        await handleAddToCart(product);
      }
    }
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground text-center mb-4">
            Save items you love for later by clicking the heart icon on products
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">My Wishlist</h3>
          <p className="text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {items.some(item => {
            const product = typeof item.product === 'object' ? item.product : null;
            return product && product.stock > 0;
          }) && (
            <Button onClick={handleAddAllToCart} className="mr-2">
              Add All to Cart
            </Button>
          )}
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Wishlist Items */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
        : 'space-y-4'
      }>
        {items.map((item) => {
          const product = typeof item.product === 'object' ? item.product : null;
          if (!product) return null;

          const hasDiscount = product.originalPrice && product.originalPrice > product.price;
          const discountPercentage = hasDiscount ? calculateDiscountPercentage(product.originalPrice!, product.price) : 0;
          const isLoading = loadingItems.has(product._id);

          if (viewMode === 'grid') {
            return (
              <Card key={item._id} className="group overflow-hidden">
                <div className="relative">
                  <Link href={`/products/${product.slug || product._id}`}>
                    <div className="relative h-48 bg-muted overflow-hidden">
                      <Image
                        src={getOptimizedImageUrl(
                          product.images[0]?.url || '/placeholder.png',
                          { width: 300, height: 300 }
                        )}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {hasDiscount && (
                        <Badge
                          variant="destructive"
                          className="absolute top-2 left-2 text-xs"
                        >
                          -{discountPercentage}%
                        </Badge>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                    onClick={() => handleRemoveFromWishlist(product._id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>

                <CardContent className="p-4 space-y-3">
                  <Link href={`/products/${product.slug || product._id}`}>
                    <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {product.brand && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {product.brand}
                    </p>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice!)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </p>

                  <Button
                    className="w-full"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0 || isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Adding...</span>
                      </div>
                    ) : product.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          } else {
            return (
              <Card key={item._id}>
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    <Link 
                      href={`/products/${product.slug || product._id}`}
                      className="relative w-24 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0"
                    >
                      <Image
                        src={getOptimizedImageUrl(
                          product.images[0]?.url || '/placeholder.png',
                          { width: 96, height: 96 }
                        )}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      {hasDiscount && (
                        <Badge
                          variant="destructive"
                          className="absolute top-1 left-1 text-xs px-1"
                        >
                          -{discountPercentage}%
                        </Badge>
                      )}
                    </Link>

                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link href={`/products/${product.slug || product._id}`}>
                            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          
                          {product.brand && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                              {product.brand}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => handleRemoveFromWishlist(product._id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatCurrency(product.originalPrice!)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          className="flex-1"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0 || isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Adding...</span>
                            </div>
                          ) : product.stock === 0 ? (
                            'Out of Stock'
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
}