"use client";
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useWishlistStore, useUIStore } from '@/store';
import { useCart, useWishlist } from '@/hooks';
import { formatCurrency, getOptimizedImageUrl, calculateDiscountPercentage } from '@/lib/utils';
import { Product } from '@/types';

export function WishlistModal() {
  const { items } = useWishlistStore();
  const { wishlistModalOpen, toggleWishlistModal } = useUIStore();
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { toggleWishlist, isLoading: isTogglingWishlist } = useWishlist();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

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

  const clearWishlist = () => {
    useWishlistStore.getState().clearWishlist();
  };

  if (items.length === 0) {
    return (
      <Sheet open={wishlistModalOpen} onOpenChange={toggleWishlistModal}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>My Wishlist</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center">
              <Heart className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Your wishlist is empty</h3>
              <p className="text-muted-foreground">
                Save items you love for later by clicking the heart icon
              </p>
            </div>
            <Button asChild onClick={toggleWishlistModal}>
              <Link href="/products">
                Start Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={wishlistModalOpen} onOpenChange={toggleWishlistModal}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>My Wishlist</span>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
            <div className="flex space-x-2">
              {items.some(item => {
                const product = typeof item.product === 'object' ? item.product : null;
                return product && product.stock > 0;
              }) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddAllToCart}
                  disabled={isAddingToCart}
                >
                  Add All to Cart
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearWishlist}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {items.map((item) => {
            const product = typeof item.product === 'object' ? item.product : null;
            if (!product) return null;

            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPercentage = hasDiscount ? calculateDiscountPercentage(product.originalPrice!, product.price) : 0;
            const isLoading = loadingItems.has(product._id);

            return (
              <div key={item._id} className="flex space-x-3 p-3 border rounded-lg group">
                {/* Product Image */}
                <Link 
                  href={`/products/${product.slug || product._id}`}
                  className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0"
                  onClick={toggleWishlistModal}
                >
                  <Image
                    src={getOptimizedImageUrl(
                      product.images[0]?.url || '/placeholder.png',
                      { width: 80, height: 80 }
                    )}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {hasDiscount && (
                    <Badge
                      variant="destructive"
                      className="absolute top-1 left-1 text-xs px-1"
                    >
                      -{discountPercentage}%
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Out of Stock</span>
                    </div>
                  )}
                </Link>

                {/* Product Info */}
                <div className="flex-1 space-y-2">
                  <Link 
                    href={`/products/${product.slug || product._id}`}
                    onClick={toggleWishlistModal}
                  >
                    <h4 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
                      {product.name}
                    </h4>
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

                  <div className="text-xs text-muted-foreground">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0 || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      ) : product.stock === 0 ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFromWishlist(product._id)}
                      className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
                      disabled={isTogglingWishlist}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Footer Actions */}
        <div className="space-y-3 py-4">
          <Button asChild className="w-full" variant="outline">
            <Link href="/wishlist" onClick={toggleWishlistModal}>
              View Full Wishlist
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={toggleWishlistModal}
          >
            Continue Shopping
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}