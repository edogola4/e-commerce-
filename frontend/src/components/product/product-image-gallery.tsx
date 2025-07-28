'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Maximize2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Product, ProductImage } from '@/types';
import { getOptimizedImageUrl, calculateDiscountPercentage } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ProductImageGalleryProps {
  product: Product;
}

export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const images = product.images || [];
  const selectedImage = images[selectedImageIndex];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercentage = hasDiscount ? calculateDiscountPercentage(product.originalPrice!, product.price) : 0;

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
    setIsImageLoading(true);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsImageLoading(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  // Helper function to get image URL
  const getImageUrl = (image: string | ProductImage): string => {
    return typeof image === 'string' ? image : image.url;
  };

  // Helper function to get image alt text
  const getImageAlt = (image: string | ProductImage, defaultAlt: string): string => {
    return typeof image === 'string' ? defaultAlt : (image.alt || defaultAlt);
  };

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
        {selectedImage && (
          <Image
            src={getOptimizedImageUrl(getImageUrl(selectedImage), { width: 600, height: 600 })}
            alt={getImageAlt(selectedImage, product.name)}
            fill
            className={cn(
              'object-cover transition-all duration-300',
              isImageLoading && 'scale-110 blur-sm'
            )}
            onLoad={() => setIsImageLoading(false)}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {hasDiscount && (
            <Badge variant="destructive" className="font-bold">
              -{discountPercentage}% OFF
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="secondary">Featured</Badge>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
              Only {product.stock} left
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="bg-white/90 hover:bg-white shadow-sm"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full">
              <div className="relative aspect-square">
                <Image
                  src={getOptimizedImageUrl(getImageUrl(selectedImage), { width: 1200, height: 1200 })}
                  alt={getImageAlt(selectedImage, product.name)}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="secondary"
            size="icon"
            className="bg-white/90 hover:bg-white shadow-sm"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {selectedImageIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              className={cn(
                'relative aspect-square bg-muted rounded-md overflow-hidden border-2 transition-all',
                index === selectedImageIndex
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-transparent hover:border-muted-foreground/20'
              )}
              onClick={() => {
                setSelectedImageIndex(index);
                setIsImageLoading(true);
              }}
            >
              <Image
                src={getOptimizedImageUrl(getImageUrl(image), { width: 100, height: 100 })}
                alt={getImageAlt(image, `${product.name} ${index + 1}`)}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Color Variants */}
      {product.variants && product.variants.some(v => v.type === 'color') && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Available Colors</h4>
          <div className="flex flex-wrap gap-2">
            {product.variants
              .filter(variant => variant.type === 'color')
              .map((variant, index) => (
                <button
                  key={index}
                  className="w-8 h-8 rounded-full border-2 border-muted-foreground/20 hover:border-primary transition-colors"
                  style={{ backgroundColor: variant.value }}
                  title={variant.name}
                  onClick={() => {
                    // Handle color variant selection
                    if (variant.images && variant.images.length > 0) {
                      // Switch to variant images if available
                    }
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}