'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useForm, useAuth, useToast } from '@/hooks';
import { useCartStore } from '@/store';
import { api } from '@/lib/api';
import { Address } from '@/types';
import { ArrowRight, CreditCard, Smartphone, Building2, MapPin, Phone, Mail, User } from 'lucide-react';

interface CheckoutFormProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

interface CheckoutFormData {
  // Shipping Address
  shippingAddress: Address;
  // Billing Address
  useSameAddress: boolean;
  billingAddress: Address;
  // Payment
  paymentMethod: 'mpesa' | 'card' | 'cod';
  mpesaPhone?: string;
  // Additional
  orderNotes?: string;
}

const initialFormData: CheckoutFormData = {
  shippingAddress: {
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya',
    isDefault: false,
    type: 'home',
  },
  useSameAddress: true,
  billingAddress: {
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya',
    isDefault: false,
    type: 'home',
  },
  paymentMethod: 'mpesa',
  orderNotes: '',
};

export function CheckoutForm({ currentStep, onStepChange }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { cart, clearCart } = useCartStore();
  const { success, error } = useToast();
  const router = useRouter();

  const { values, handleChange, setFieldValue } = useForm(initialFormData);

  const steps = [
    { title: 'Shipping Address', icon: MapPin },
    { title: 'Payment Method', icon: CreditCard },
    { title: 'Review Order', icon: User },
  ];

  const kenyanCounties = [
    'Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Machakos', 'Kajiado',
    'Kisumu', 'Uasin Gishu', 'Meru', 'Kilifi', 'Kwale', 'Laikipia'
  ];

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const orderData = {
        items: cart.items.map(item => ({
          product: typeof item.product === 'string' ? item.product : item.product._id,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
        })),
        shippingAddress: values.shippingAddress,
        billingAddress: values.useSameAddress ? values.shippingAddress : values.billingAddress,
        paymentMethod: {
          type: values.paymentMethod,
          details: values.paymentMethod === 'mpesa' ? { phoneNumber: values.mpesaPhone } : {},
        },
        orderNotes: values.orderNotes,
        pricing: {
          subtotal: cart.subtotal,
          shipping: cart.shipping,
          tax: cart.tax,
          discount: cart.discount,
          total: cart.total,
        },
      };

      const response = await api.orders.createOrder(orderData);
      
      // If M-Pesa payment, initiate payment
      if (values.paymentMethod === 'mpesa' && values.mpesaPhone) {
        await api.payments.initiateMpesaPayment({
          phoneNumber: values.mpesaPhone,
          amount: cart.total,
          orderId: response.data._id,
        });
      }

      clearCart();
      success('Order placed successfully!');
      router.push(`/orders/${response.data._id}`);
    } catch (err: any) {
      error('Failed to place order. Please try again.');
      console.error('Order submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      onStepChange(currentStep + 1);
    } else {
      handleSubmitOrder();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Shipping Address
        const shipping = values.shippingAddress;
        return shipping.name && shipping.phone && shipping.addressLine1 && shipping.city && shipping.state;
      case 1: // Payment Method
        if (values.paymentMethod === 'mpesa') {
          return values.mpesaPhone && values.mpesaPhone.length >= 10;
        }
        return true;
      case 2: // Review Order
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 0: Shipping Address */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Shipping Address</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipping-name">Full Name</Label>
                <Input
                  id="shipping-name"
                  placeholder="Enter full name"
                  value={values.shippingAddress.name}
                  onChange={(e) => setFieldValue('shippingAddress', {
                    ...values.shippingAddress,
                    name: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping-phone">Phone Number</Label>
                <Input
                  id="shipping-phone"
                  type="tel"
                  placeholder="0700 123 456"
                  value={values.shippingAddress.phone}
                  onChange={(e) => setFieldValue('shippingAddress', {
                    ...values.shippingAddress,
                    phone: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-address1">Address Line 1</Label>
              <Input
                id="shipping-address1"
                placeholder="Street address, P.O. Box, etc."
                value={values.shippingAddress.addressLine1}
                onChange={(e) => setFieldValue('shippingAddress', {
                  ...values.shippingAddress,
                  addressLine1: e.target.value
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-address2">Address Line 2 (Optional)</Label>
              <Input
                id="shipping-address2"
                placeholder="Apartment, suite, unit, building, floor, etc."
                value={values.shippingAddress.addressLine2}
                onChange={(e) => setFieldValue('shippingAddress', {
                  ...values.shippingAddress,
                  addressLine2: e.target.value
                })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shipping-city">City</Label>
                <Input
                  id="shipping-city"
                  placeholder="City"
                  value={values.shippingAddress.city}
                  onChange={(e) => setFieldValue('shippingAddress', {
                    ...values.shippingAddress,
                    city: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping-state">County</Label>
                <Select
                  value={values.shippingAddress.state}
                  onValueChange={(value) => setFieldValue('shippingAddress', {
                    ...values.shippingAddress,
                    state: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyanCounties.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipping-postal">Postal Code</Label>
                <Input
                  id="shipping-postal"
                  placeholder="00100"
                  value={values.shippingAddress.postalCode}
                  onChange={(e) => setFieldValue('shippingAddress', {
                    ...values.shippingAddress,
                    postalCode: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address Type</Label>
              <RadioGroup
                value={values.shippingAddress.type}
                onValueChange={(value: 'home' | 'work' | 'other') => 
                  setFieldValue('shippingAddress', {
                    ...values.shippingAddress,
                    type: value
                  })
                }
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home">Home</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="work" id="work" />
                  <Label htmlFor="work">Work</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Payment Method */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Billing Address */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="same-address"
                  checked={values.useSameAddress}
                  onCheckedChange={(checked) => setFieldValue('useSameAddress', checked)}
                />
                <Label htmlFor="same-address">
                  Same as shipping address
                </Label>
              </div>

              {!values.useSameAddress && (
                <div className="space-y-4">
                  {/* Billing address fields (similar to shipping) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billing-name">Full Name</Label>
                      <Input
                        id="billing-name"
                        placeholder="Enter full name"
                        value={values.billingAddress.name}
                        onChange={(e) => setFieldValue('billingAddress', {
                          ...values.billingAddress,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-phone">Phone Number</Label>
                      <Input
                        id="billing-phone"
                        type="tel"
                        placeholder="0700 123 456"
                        value={values.billingAddress.phone}
                        onChange={(e) => setFieldValue('billingAddress', {
                          ...values.billingAddress,
                          phone: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  {/* Add other billing address fields as needed */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={values.paymentMethod}
                onValueChange={(value: 'mpesa' | 'card' | 'cod') => 
                  setFieldValue('paymentMethod', value)
                }
                className="space-y-4"
              >
                {/* M-Pesa */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="mpesa" id="mpesa" />
                  <div className="flex-1">
                    <Label htmlFor="mpesa" className="flex items-center space-x-3 cursor-pointer">
                      <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">M-Pesa</div>
                        <div className="text-sm text-muted-foreground">Pay with your mobile money</div>
                      </div>
                    </Label>
                  </div>
                </div>

                {values.paymentMethod === 'mpesa' && (
                  <div className="ml-8 space-y-2">
                    <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                    <Input
                      id="mpesa-phone"
                      type="tel"
                      placeholder="254700123456"
                      value={values.mpesaPhone || ''}
                      onChange={(e) => setFieldValue('mpesaPhone', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      You will receive a payment prompt on your phone
                    </p>
                  </div>
                )}

                {/* Credit/Debit Card */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                  <RadioGroupItem value="card" id="card" disabled />
                  <div className="flex-1">
                    <Label htmlFor="card" className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">Credit/Debit Card</div>
                        <div className="text-sm text-muted-foreground">Coming soon</div>
                      </div>
                    </Label>
                  </div>
                </div>

                {/* Cash on Delivery */}
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <RadioGroupItem value="cod" id="cod" />
                  <div className="flex-1">
                    <Label htmlFor="cod" className="flex items-center space-x-3 cursor-pointer">
                      <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium">Cash on Delivery</div>
                        <div className="text-sm text-muted-foreground">Pay when you receive your order</div>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="order-notes">Order Notes (Optional)</Label>
                <textarea
                  id="order-notes"
                  className="w-full min-h-[80px] p-3 border rounded-md resize-none"
                  placeholder="Special instructions for delivery..."
                  value={values.orderNotes || ''}
                  onChange={(e) => setFieldValue('orderNotes', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Review Order */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Your Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shipping Address Review */}
            <div>
              <h4 className="font-medium mb-2">Shipping Address</h4>
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{values.shippingAddress.name}</p>
                <p>{values.shippingAddress.phone}</p>
                <p>{values.shippingAddress.addressLine1}</p>
                {values.shippingAddress.addressLine2 && (
                  <p>{values.shippingAddress.addressLine2}</p>
                )}
                <p>{values.shippingAddress.city}, {values.shippingAddress.state} {values.shippingAddress.postalCode}</p>
              </div>
            </div>

            {/* Payment Method Review */}
            <div>
              <h4 className="font-medium mb-2">Payment Method</h4>
              <div className="p-3 bg-muted rounded-lg text-sm">
                {values.paymentMethod === 'mpesa' && (
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-green-600" />
                    <span>M-Pesa ({values.mpesaPhone})</span>
                  </div>
                )}
                {values.paymentMethod === 'cod' && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <span>Cash on Delivery</span>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                By placing this order, you agree to our{' '}
                <a href="/terms" className="underline">Terms of Service</a> and{' '}
                <a href="/privacy" className="underline">Privacy Policy</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <Button
          onClick={handleNextStep}
          disabled={!isStepValid() || isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </div>
          ) : currentStep === steps.length - 1 ? (
            'Place Order'
          ) : (
            <div className="flex items-center space-x-2">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}