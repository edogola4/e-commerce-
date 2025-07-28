"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowRight, 
  Share2, 
  Star,
  Sparkles,
  Gift,
  TrendingUp,
  Clock,
  Package,
  X,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useWishlistStore, useUIStore } from '@/store';
import { useCart, useWishlist } from '@/hooks';
import { formatCurrency, getOptimizedImageUrl, calculateDiscountPercentage } from '@/lib/utils';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

export function WishlistModal() {
  const { items } = useWishlistStore();
  const { wishlistModalOpen, toggleWishlistModal } = useUIStore();
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { toggleWishlist, isLoading: isTogglingWishlist } = useWishlist();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const handleAddToCart = async (product: Product) => {
    if (product.stock === 0) return;
    
    setLoadingItems(prev => new Set(prev).add(product._id));
    try {
      await addToCart(product._id, 1);
      setAddedItems(prev => new Set(prev).add(product._id));
      // Remove from added items after 2 seconds
      setTimeout(() => {
        setAddedItems(prev => {
          const updated = new Set(prev);
          updated.delete(product._id);
          return updated;
        });
      }, 2000);
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
    setRemovingItems(prev => new Set(prev).add(productId));
    try {
      await toggleWishlist(productId, true);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    } finally {
      setRemovingItems(prev => {
        const updated = new Set(prev);
        updated.delete(productId);
        return updated;
      });
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

  const totalValue = items.reduce((sum, item) => {
    const product = typeof item.product === 'object' ? item.product : null;
    return sum + (product?.price || 0);
  }, 0);

  const availableItems = items.filter(item => {
    const product = typeof item.product === 'object' ? item.product : null;
    return product && product.stock > 0;
  });

  if (items.length === 0) {
    return (
      <Sheet open={wishlistModalOpen} onOpenChange={toggleWishlistModal}>
        <SheetContent className="w-full sm:max-w-lg bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <SheetHeader className="pb-6">
            <SheetTitle className="flex items-center space-x-3 text-xl">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                My Wishlist
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center h-full space-y-6 -mt-20">
            {/* Animated empty state */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-100 to-red-100 dark:from-pink-900/20 dark:to-red-900/20 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <Heart className="h-16 w-16 text-pink-400 relative z-10 group-hover:scale-110 group-hover:text-pink-500 transition-all duration-300" />
                <div className="absolute top-2 right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full animate-ping"></div>
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse" />
            </div>

            <div className="text-center space-y-3 max-w-sm">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Your wishlist is empty
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Save items you love for later by clicking the heart icon. Build your perfect collection!
              </p>
            </div>

            <div className="space-y-3 w-full max-w-xs">
              <Button 
                asChild 
                onClick={toggleWishlistModal}
                className="w-full h-12 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
              >
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Start Shopping
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>

              <Button 
                variant="outline" 
                asChild
                onClick={toggleWishlistModal}
                className="w-full h-12 border-2 border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-600 rounded-2xl hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all duration-300"
              >
                <Link href="/categories">
                  Explore Categories
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={wishlistModalOpen} onOpenChange={toggleWishlistModal}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  My Wishlist
                </span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {formatCurrency(totalValue)} total
                  </span>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWishlistModal}
              className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetTitle>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-4">
            {availableItems.length > 0 && (
              <Button
                onClick={handleAddAllToCart}
                disabled={isAddingToCart}
                className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group"
              >
                <ShoppingCart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                Add All to Cart
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-none">
                  {availableItems.length}
                </Badge>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={clearWishlist}
              className="px-6 h-11 border-2 border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 rounded-xl transition-all duration-300 group"
            >
              <Trash2 className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
              Clear All
            </Button>
          </div>
        </SheetHeader>

        {/* Wishlist Items */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {items.map((item, index) => {
            const product = typeof item.product === 'object' ? item.product : null;
            if (!product) return null;

            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPercentage = hasDiscount ? calculateDiscountPercentage(product.originalPrice!, product.price) : 0;
            const isLoading = loadingItems.has(product._id);
            const isAdded = addedItems.has(product._id);
            const isRemoving = removingItems.has(product._id);
            const daysInWishlist = Math.floor((Date.now() - new Date(item.addedAt).getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div 
                key={item._id} 
                className={cn(
                  "group relative p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1",
                  isRemoving && "opacity-50 scale-95",
                  isAdded && "ring-2 ring-green-500/50 bg-green-50/80 dark:bg-green-900/20"
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
              >
                {/* Success overlay for added items */}
                {isAdded && (
                  <div className="absolute inset-0 bg-green-500/10 rounded-2xl flex items-center justify-center z-10">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg animate-in zoom-in duration-300">
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="text-sm font-medium">Added to Cart!</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  {/* Product Image */}
                  <Link 
                    href={`/products/${product.slug || product._id}`}
                    className="relative w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-2xl overflow-hidden flex-shrink-0 group/image"
                    onClick={toggleWishlistModal}
                  >
                    <Image
                      src={getOptimizedImageUrl(
                        product.images[0]?.url || '/placeholder.png',
                        { width: 96, height: 96 }
                      )}
                      alt={product.name}
                      fill
                      className="object-cover group-hover/image:scale-110 transition-transform duration-500"
                      sizes="96px"
                    />
                    
                    {hasDiscount && (
                      <Badge
                        variant="destructive"
                        className="absolute top-2 left-2 text-xs px-2 py-1 bg-gradient-to-r from-red-500 to-orange-500 border-none shadow-md"
                      >
                        -{discountPercentage}%
                      </Badge>
                    )}
                    
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <Package className="h-5 w-5 text-white mx-auto mb-1" />
                          <span className="text-white text-xs font-semibold">Out of Stock</span>
                        </div>
                      </div>
                    )}
                    
                    {daysInWishlist > 7 && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Link 
                        href={`/products/${product.slug || product._id}`}
                        onClick={toggleWishlistModal}
                        className="group/link"
                      >
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors duration-300">
                          {product.name}
                        </h4>
                      </Link>

                      {product.brand && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wide font-medium mt-1">
                          {product.brand}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 line-through">
                          {formatCurrency(product.originalPrice!)}
                        </span>
                      )}
                      {hasDiscount && (
                        <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
                          Save {formatCurrency(product.originalPrice! - product.price)}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {daysInWishlist === 0 ? 'Added today' : 
                           daysInWishlist === 1 ? 'Added yesterday' : 
                           `Added ${daysInWishlist} days ago`}
                        </span>
                      </span>
                      {product.rating && (
                        <span className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span>{product.rating}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0 || isLoading || isAdded}
                        className={cn(
                          "flex-1 h-10 rounded-xl transition-all duration-300 group/btn",
                          isAdded 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg hover:scale-105"
                        )}
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : isAdded ? (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Added!
                          </>
                        ) : product.stock === 0 ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform duration-300" />
                            Add to Cart
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromWishlist(product._id)}
                        className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 group/remove"
                        disabled={isTogglingWishlist || isRemoving}
                      >
                        {isRemoving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="h-4 w-4 group-hover/remove:scale-110 transition-transform duration-300" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300 group/share"
                      >
                        <Share2 className="h-4 w-4 group-hover/share:scale-110 transition-transform duration-300" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

        {/* Footer Actions */}
        <div className="space-y-3 py-6">
          <div className="grid grid-cols-2 gap-3">
            <Button 
              asChild 
              variant="outline"
              className="h-12 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-300 group"
            >
              <Link href="/wishlist" onClick={toggleWishlistModal}>
                <Heart className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                View Full Wishlist
              </Link>
            </Button>

            <Button
              asChild
              className="h-12 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group"
            >
              <Link href="/products" onClick={toggleWishlistModal}>
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </div>

          {/* Wishlist insights */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">Wishlist Insights</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {availableItems.length > 0 ? (
                    `${availableItems.length} item${availableItems.length === 1 ? '' : 's'} ready to purchase • Save ${formatCurrency(totalValue * 0.1)} with bulk discount`
                  ) : (
                    'Some items are out of stock. We\'ll notify you when they\'re available!'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

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
      </SheetContent>
    </Sheet>
  );
}