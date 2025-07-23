'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store';
import { formatCurrency, getOptimizedImageUrl } from '@/lib/utils';

export function CheckoutSummary() {
  const { cart } = useCartStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cart Items */}
        <div className="space-y-3">
          {cart.items.map((item) => {
            const product = typeof item.product === 'object' ? item.product : null;
            if (!product) return null;

            return (
              <div key={item._id} className="flex space-x-3">
                <div className="relative w-16 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={getOptimizedImageUrl(
                      product.images[0]?.url || '/placeholder.png',
                      { width: 64, height: 64 }
                    )}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {item.quantity}
                  </Badge>
                </div>
                
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {product.name}
                  </h4>
                  {item.variant && (
                    <p className="text-xs text-muted-foreground">
                      {item.variant.type}: {item.variant.value}
                    </p>
                  )}
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

        {/* Order Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({cart.itemCount} items)</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>
          
          {cart.shipping > 0 ? (
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatCurrency(cart.shipping)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm text-green-600">
              <span>Shipping</span>
              <span>Free</span>
            </div>
          )}
          
          {cart.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax (VAT 16%)</span>
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
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
        </div>

        {/* Free Shipping Banner */}
        {cart.shipping === 0 && cart.subtotal >= 1000 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              🎉 You qualify for free shipping!
            </p>
          </div>
        )}

        {/* Security Badges */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Safe Payment</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}