// src/components/product/product-card.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, ShoppingCart, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  showQuickActions?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Utility functions (inline since we don't know the utils structure)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
};

const calculateDiscountPercentage = (originalPrice: number, currentPrice: number): number => {
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

const getOptimizedImageUrl = (url: string, options?: { width?: number; height?: number }): string => {
  // Return the original URL - you can implement image optimization later
  return url;
};

const generateStarRating = (rating: number): ('full' | 'half' | 'empty')[] => {
  const stars: ('full' | 'half' | 'empty')[] = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('full');
    } else if (i === fullStars && hasHalfStar) {
      stars.push('half');
    } else {
      stars.push('empty');
    }
  }
  
  return stars;
};

export function ProductCard({ 
  product, 
  className,
  showQuickActions = true,
  size = 'md'
}: ProductCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  
  // Handle different image formats from your API
  const getImageUrl = (image: string | { url: string; alt?: string }): string => {
    if (typeof image === 'string') {
      return image;
    }
    return image.url;
  };
  
  const getImageAlt = (image: string | { url: string; alt?: string }): string => {
    if (typeof image === 'string') {
      return product.name;
    }
    return image.alt || product.name;
  };
  
  // Safely get images array
  const images = Array.isArray(product.images) ? product.images : [];
  const primaryImage = images[currentImageIndex] || images[0];
  
  // Handle different price formats
  const currentPrice = product.price;
  const originalPrice = product.originalPrice || product.comparePrice;
  const hasDiscount = originalPrice && originalPrice > currentPrice;
  const discountPercentage = hasDiscount ? calculateDiscountPercentage(originalPrice, currentPrice) : 0;
  
  // Handle different rating formats
  const getRating = (): { average: number; count: number } => {
    if (typeof product.rating === 'number') {
      return { average: product.rating, count: product.reviewCount || 0 };
    }
    if (product.rating && typeof product.rating === 'object') {
      return { 
        average: product.rating.average || 0, 
        count: product.rating.count || 0 
      };
    }
    return { average: 0, count: 0 };
  };
  
  const rating = getRating();
  const stars = generateStarRating(rating.average);

  const cardSizes = {
    sm: 'w-full max-w-xs',
    md: 'w-full max-w-sm',
    lg: 'w-full max-w-md',
  };

  const imageSizes = {
    sm: 'h-48',
    md: 'h-64',
    lg: 'h-80',
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToCart(true);
    try {
      // TODO: Implement cart functionality
      console.log('Adding to cart:', product._id);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // TODO: Implement wishlist functionality
      setIsInWishlist(!isInWishlist);
      console.log('Toggling wishlist:', product._id);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: `${window.location.origin}/products/${product.slug || product._id}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/products/${product.slug || product._id}`);
        console.log('Link copied to clipboard');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    // Navigate to product page
    window.location.href = `/products/${product.slug || product._id}`;
  };

  const handleViewProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.slug || product._id}`;
  };

  return (
    <Card className={cn(
      'group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-card cursor-pointer',
      cardSizes[size],
      className
    )}
    onClick={handleCardClick}
    >
      <div className="relative">
        {/* Product Image */}
        <div className={cn('relative overflow-hidden bg-muted', imageSizes[size])}>
          {primaryImage ? (
            <div className="relative w-full h-full">
              <Image
                src={getOptimizedImageUrl(getImageUrl(primaryImage), { 
                  width: size === 'sm' ? 300 : size === 'md' ? 400 : 500,
                  height: size === 'sm' ? 300 : size === 'md' ? 400 : 500 
                })}
                alt={getImageAlt(primaryImage)}
                fill
                className={cn(
                  'object-cover transition-all duration-300 group-hover:scale-105',
                  isImageLoading && 'scale-110 blur-lg'
                )}
                onLoad={() => setIsImageLoading(false)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
          
          {/* Image Navigation Dots */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  )}
                  onMouseEnter={() => setCurrentImageIndex(index)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col space-y-1">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs font-bold">
                -{discountPercentage}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
            {product.stock <= 5 && product.stock > 0 && (
              <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                Only {product.stock} left
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                onClick={handleWishlistToggle}
              >
                <Heart className={cn(
                  'h-4 w-4 transition-colors',
                  isInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                )} />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                onClick={handleViewProduct}
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}

          {/* Quick Add to Cart */}
          {showQuickActions && product.stock > 0 && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="h-8 text-xs"
              >
                {isAddingToCart ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <>
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <CardContent className="p-4 space-y-3">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {product.brand}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {rating.count > 0 && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {stars.map((star, index) => (
                  <Star
                    key={index}
                    className={cn(
                      'h-3 w-3',
                      star === 'full'
                        ? 'text-yellow-400 fill-yellow-400'
                        : star === 'half'
                        ? 'text-yellow-400 fill-yellow-400/50'
                        : 'text-gray-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({rating.count})
              </span>
            </div>
          )}

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          {/* Features/Tags */}
          {product.features && product.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.features.slice(0, 2).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                  {feature}
                </Badge>
              ))}
              {product.features.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{product.features.length - 2} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </div>

      {/* Card Footer with Actions */}
      <CardFooter className="p-4 pt-0">
        <div className="w-full space-y-2">
          {/* Stock Status */}
          {product.stock <= 10 && product.stock > 0 && (
            <div className="w-full bg-orange-100 rounded-full h-1">
              <div 
                className="bg-orange-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(product.stock / 10) * 100}%` }}
              />
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            className="w-full"
            variant={product.stock === 0 ? "outline" : "default"}
            disabled={product.stock === 0 || isAddingToCart}
            onClick={handleAddToCart}
            size="sm"
          >
            {isAddingToCart ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Adding...</span>
              </div>
            ) : product.stock === 0 ? (
              'Out of Stock'
            ) : (
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Add to Cart</span>
              </div>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}