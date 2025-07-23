'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/types';

interface ProductTabsProps {
  product: Product;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ProductTabs({ product, activeTab, onTabChange }: ProductTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
        <TabsTrigger value="shipping">Shipping</TabsTrigger>
        <TabsTrigger value="reviews">Reviews ({product.rating?.count || 0})</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-4">Product Description</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
                
                {product.features && product.features.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {product.features.map((feature, index) => (
                        <li key={index} className="text-muted-foreground">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="specifications" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
            
            {product.specifications && Object.keys(product.specifications).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <div key={index}>
                    <div className="flex justify-between py-2">
                      <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                    {index < Object.entries(product.specifications).length - 1 && <Separator />}
                  </div>
                ))}

                {product.dimensions && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Dimensions & Weight:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Length:</span>
                          <span className="text-muted-foreground">{product.dimensions.length} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Width:</span>
                          <span className="text-muted-foreground">{product.dimensions.width} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Height:</span>
                          <span className="text-muted-foreground">{product.dimensions.height} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight:</span>
                          <span className="text-muted-foreground">{product.dimensions.weight} kg</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No specifications available for this product.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="shipping" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            
            <div className="space-y-4">
              {product.shipping ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Shipping Cost:</span>
                    <span className={product.shipping.freeShipping ? 'text-green-600 font-medium' : ''}>
                      {product.shipping.freeShipping ? 'Free Shipping' : `KES ${product.shipping.shippingCost}`}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Package Dimensions:</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Length: {product.shipping.dimensions.length} cm</p>
                      <p>Width: {product.shipping.dimensions.width} cm</p>
                      <p>Height: {product.shipping.dimensions.height} cm</p>
                      <p>Weight: {product.shipping.weight} kg</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Standard Shipping:</span>
                    <span>KES 200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Express Shipping:</span>
                    <span>KES 500</span>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Delivery Information:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Standard delivery: 3-5 business days</p>
                  <p>• Express delivery: 1-2 business days</p>
                  <p>• Free shipping on orders over KES 1,000</p>
                  <p>• Same-day delivery available in Nairobi CBD</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Return Policy:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• 30-day return policy</p>
                  <p>• Items must be in original condition</p>
                  <p>• Free returns for defective items</p>
                  <p>• Return shipping cost: KES 200</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews" className="mt-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Customer Reviews</h3>
              <p className="text-muted-foreground mb-4">
                {product.rating?.count || 0} review{(product.rating?.count || 0) !== 1 ? 's' : ''}
              </p>
              
              {product.rating && product.rating.count > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl font-bold">{product.rating.average.toFixed(1)}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.round(product.rating!.average) ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {product.rating.distribution && (
                    <div className="space-y-2 max-w-xs mx-auto">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2 text-sm">
                          <span className="w-8">{rating}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div 
                              className="h-2 bg-yellow-400 rounded"
                              style={{ 
                                width: `${((product.rating!.distribution[rating as keyof typeof product.rating.distribution] || 0) / product.rating!.count) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="w-8 text-right">
                            {product.rating.distribution[rating as keyof typeof product.rating.distribution] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}