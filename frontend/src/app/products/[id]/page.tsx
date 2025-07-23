'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ProductImageGallery } from '@/components/product/product-image-gallery';
import { ProductInfo } from '@/components/product/product-info';
import { ProductTabs } from '@/components/product/products-tabs';
import { RelatedProducts } from '@/components/product/related-products';
import { ProductReviews } from '@/components/product/product-reviews';
import { RecommendationsSection } from '@/components/home/recommendations-section';
import { useProductsStore } from '@/store';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { currentProduct, isLoading, fetchProduct } = useProductsStore();
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (id) {
      fetchProduct(id as string);
    }
  }, [id, fetchProduct]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery Skeleton */}
          <div className="space-y-4">
            <div className="skeleton h-96 w-full rounded-lg" />
            <div className="flex space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-20 w-20 rounded-md" />
              ))}
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="space-y-6">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-12 w-32" />
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/products">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {currentProduct.category && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/categories/${currentProduct.category.slug}`}>
                      {currentProduct.category.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage className="line-clamp-1">
                  {currentProduct.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <ProductImageGallery product={currentProduct} />
          <ProductInfo product={currentProduct} />
        </div>

        {/* Product Tabs */}
        <div className="mb-12">
          <ProductTabs 
            product={currentProduct} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <ProductReviews productId={currentProduct._id} />
        </div>

        {/* Related Products */}
        <div className="mb-12">
          <RelatedProducts productId={currentProduct._id} />
        </div>

        {/* Recommendations */}
        <div className="mb-12">
          <RecommendationsSection />
        </div>
      </div>
    </div>
  );
}