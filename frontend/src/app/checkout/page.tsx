'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { CheckoutSummary } from '@/components/checkout/checkout-summary';
import { CheckoutSteps } from '@/components/checkout/checkout-steps';
import { useAuth } from '@/hooks';
import { useCartStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingCart, ArrowLeft } from 'lucide-react';

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { isAuthenticated } = useAuth();
  const { cart } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
      return;
    }

    // Redirect to cart if empty
    if (cart.items.length === 0) {
      router.push('/cart');
      return;
    }
  }, [isAuthenticated, cart.items.length, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <h2 className="text-xl font-semibold">Please Login</h2>
            <p className="text-muted-foreground">
              You need to be logged in to proceed with checkout
            </p>
            <Button asChild>
              <Link href="/login?redirect=/checkout">Login to Continue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Your cart is empty</h2>
            <p className="text-muted-foreground">
              Add some items to your cart before checkout
            </p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/cart">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Cart
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Checkout</h1>
            </div>
            
            {/* Secure Checkout Badge */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Checkout Steps */}
        <div className="mb-8">
          <CheckoutSteps currentStep={currentStep} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm 
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}