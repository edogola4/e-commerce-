'use client';

import { useState } from 'react';
import { Minus, Plus, Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart, useWishlist } from '@/hooks';
import { useWishlistStore } from '@/store';
import { Product, ProductVariant, ProductRating } from '@/types';
import { formatCurrency, generateStarRating } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  
  const { addToCart, isLoading: isAddingToCart } = useCart();
  const { toggleWishlist, isLoading: isTogglingWishlist } = useWishlist();
  const { isInWishlist } = useWishlistStore();
  
  const isInWishlistCheck = isInWishlist(product._id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const ratingValue = typeof product.rating === 'number' ? product.rating : product.rating?.average || 0;
  const stars = generateStarRating(ratingValue);

  // Group variants by type
  const variantTypes = product.variants?.reduce((acc, variant) => {
    if (!acc[variant.type]) {
      acc[variant.type] = [];
    }
    acc[variant.type].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>) || {};

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product.maxOrderQuantity || 99)) {
      setQuantity(newQuantity);
    }
  };

  const handleVariantSelect = (type: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity, selectedVariants);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleWishlistToggle = async () => {
    try {
      await toggleWishlist(product._id, isInWishlistCheck);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const canAddToCart = product.stock > 0 && quantity <= product.stock;

  return (
    <div className="space-y-6">
      {/* Brand */}
      {product.brand && (
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">{product.brand}</Badge>
          <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
        </div>
      )}

      {/* Product Name */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
          {product.name}
        </h1>
        {product.shortDescription && (
          <p className="text-muted-foreground">
            {product.shortDescription}
          </p>
        )}
      </div>

      {/* Rating */}
      {product.rating && (typeof product.rating === 'number' ? product.rating > 0 : product.rating.count > 0) && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {stars.map((star, index) => (
              <Star
                key={index}
                className={cn(
                  'h-4 w-4',
                  star === 'full'
                    ? 'text-yellow-400 fill-yellow-400'
                    : star === 'half'
                    ? 'text-yellow-400 fill-yellow-400/50'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex items-center">
              {stars}
              <span className="ml-1">
                ({typeof product.rating === 'number' ? product.rating.toFixed(1) : product.rating.average.toFixed(1)})
              </span>
            </div>
            <span>•</span>
            <span>
              {typeof product.rating === 'number' ? '0' : product.rating.count} {typeof product.rating === 'number' ? 'review' : product.rating.count === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>
      )}

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <span className="text-3xl font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.originalPrice!)}
              </span>
              <Badge variant="destructive" className="text-sm">
                Save {formatCurrency(product.originalPrice! - product.price)}
              </Badge>
            </>
          )}
        </div>
        
        {product.stock <= 10 && product.stock > 0 && (
          <p className="text-sm text-orange-600">
            Only {product.stock} left in stock!
          </p>
        )}
      </div>

      <Separator />

      {/* Variants */}
      {Object.keys(variantTypes).length > 0 && (
        <div className="space-y-4">
          {Object.entries(variantTypes).map(([type, variants]) => (
            <div key={type} className="space-y-2">
              <label className="text-sm font-medium capitalize">
                Select {type}:
              </label>
              
              {type === 'color' ? (
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant, index) => (
                    <button
                      key={index}
                      className={cn(
                        'w-10 h-10 rounded-full border-2 transition-all',
                        selectedVariants[type] === variant.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-muted-foreground/20 hover:border-primary/50'
                      )}
                      style={{ backgroundColor: variant.value }}
                      title={variant.name}
                      onClick={() => handleVariantSelect(type, variant.value)}
                    />
                  ))}
                </div>
              ) : (
                <Select
                  value={selectedVariants[type] || ''}
                  onValueChange={(value) => handleVariantSelect(type, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Choose ${type}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant, index) => (
                      <SelectItem key={index} value={variant.value}>
                        {variant.name}
                        {variant.price && (
                          <span className="ml-2 text-muted-foreground">
                            (+{formatCurrency(variant.price)})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quantity:</label>
        <div className="flex items-center space-x-3">
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => handleQuantityChange(1)}
              disabled={quantity >= (product.maxOrderQuantity || 99) || quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {product.stock} available
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="flex space-x-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={handleAddToCart}
            disabled={!canAddToCart || isAddingToCart}
          >
            {isAddingToCart ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Adding...</span>
              </div>
            ) : product.stock === 0 ? (
              'Out of Stock'
            ) : (
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart</span>
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleWishlistToggle}
            disabled={isTogglingWishlist}
            className={cn(
              'px-4',
              isInWishlistCheck && 'text-red-600 border-red-200 bg-red-50'
            )}
          >
            <Heart className={cn(
              'h-5 w-5',
              isInWishlistCheck && 'fill-red-600'
            )} />
          </Button>
        </div>

        {/* Buy Now Button */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={!canAddToCart}
        >
          Buy Now
        </Button>
      </div>

      <Separator />

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Key Features</h3>
          <ul className="space-y-2">
            {product.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Trust Badges */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-4 w-4 text-green-600" />
              <div className="text-xs">
                <div className="font-medium">Free Shipping</div>
                <div className="text-muted-foreground">On orders over KES 1,000</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <div className="text-xs">
                <div className="font-medium">Secure Payment</div>
                <div className="text-muted-foreground">SSL encrypted</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <RotateCcw className="h-4 w-4 text-orange-600" />
              <div className="text-xs">
                <div className="font-medium">Easy Returns</div>
                <div className="text-muted-foreground">30-day return policy</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-600" />
              <div className="text-xs">
                <div className="font-medium">Quality Assured</div>
                <div className="text-muted-foreground">Verified products</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Info */}
      {product.seller && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sold by {product.seller.name}</h4>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {product.seller.rating.toFixed(1)} seller rating
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                View Store
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share */}
      <div className="flex items-center space-x-4 pt-4">
        <span className="text-sm font-medium">Share:</span>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Facebook
          </Button>
          <Button variant="outline" size="sm">
            Twitter
          </Button>
          <Button variant="outline" size="sm">
            WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}