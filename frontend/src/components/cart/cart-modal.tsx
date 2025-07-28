"use client";
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCartStore, useUIStore } from '@/store';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CartModal() {
  const { cart } = useCartStore();
  const { cartModalOpen, toggleCartModal } = useUIStore();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      await useCartStore.getState().updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(itemId);
        return updated;
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await useCartStore.getState().removeFromCart(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = () => {
    useCartStore.getState().clearCart();
  };

  if (cart.items.length === 0) {
    return (
      <Sheet open={cartModalOpen} onOpenChange={toggleCartModal}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Shopping Cart</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Your cart is empty</h3>
              <p className="text-muted-foreground">
                Looks like you haven't added anything to your cart yet
              </p>
            </div>
            <Button asChild onClick={toggleCartModal}>
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
    <Sheet open={cartModalOpen} onOpenChange={toggleCartModal}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Shopping Cart</span>
              <Badge variant="secondary">{cart.itemCount}</Badge>
            </div>
            {cart.items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {cart.items.map((item) => {
            const product = typeof item.product === 'object' ? item.product : null;
            if (!product) return null;

            const isUpdating = updatingItems.has(item._id || '');

            return (
              <div key={item._id} className="flex space-x-3 p-3 border rounded-lg">
                {/* Product Image */}
                <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={getOptimizedImageUrl(
                      typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url || '/placeholder.png',
                      { width: 64, height: 64 }
                    )}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </h4>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant.type}: {item.variant.value}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item._id || '', item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className={cn(
                        'text-sm font-medium w-8 text-center',
                        isUpdating && 'opacity-50'
                      )}>
                        {isUpdating ? '...' : item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item._id || '', item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeItem(item._id || '')}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice * item.quantity)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Cart Summary */}
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(cart.subtotal)}</span>
            </div>
            {cart.shipping > 0 && (
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>{formatCurrency(cart.shipping)}</span>
              </div>
            )}
            {cart.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(cart.tax)}</span>
              </div>
            )}
            {cart.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(cart.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(cart.total)}</span>
            </div>
          </div>

          {/* Free Shipping Banner */}
          {cart.subtotal < 1000 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Add {formatCurrency(1000 - cart.subtotal)} more for free shipping!
              </p>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((cart.subtotal / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button asChild className="w-full" size="lg">
              <Link href="/checkout" onClick={toggleCartModal}>
                Proceed to Checkout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/cart" onClick={toggleCartModal}>
                View Cart Details
              </Link>
            </Button>
          </div>

          {/* Continue Shopping */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={toggleCartModal}
          >
            Continue Shopping
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}