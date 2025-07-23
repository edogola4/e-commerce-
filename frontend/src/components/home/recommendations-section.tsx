'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api'; // FIXED: Correct import path
import { Product } from '@/types';

export function RecommendationsSection() {
  // FIXED: Removed useAuth dependency that doesn't exist
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [recommendations, setRecommendations] = useState<Record<string, Product[]>>({
    trending: [],
    recommended: [],
    recent: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCarousels, setActiveCarousels] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchRecommendations();
  }, [isAuthenticated]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // FIXED: Better error handling and data validation
      const fetchPromises = [];
      
      // Always fetch trending
      fetchPromises.push(
        api.recommendations.getTrendingProducts(10).catch(err => {
          console.warn('Trending products failed:', err);
          return { data: [] };
        })
      );

      // Fetch personalized only if authenticated
      if (isAuthenticated) {
        fetchPromises.push(
          api.recommendations.getPersonalizedRecommendations('recommended', 8).catch(err => {
            console.warn('Personalized recommendations failed:', err);
            return { data: [] };
          })
        );
      } else {
        fetchPromises.push(Promise.resolve({ data: [] }));
      }

      // Fetch recent products
      fetchPromises.push(
        api.products.getProducts({ 
          sort: '-createdAt', 
          limit: 8,
          isActive: true 
        }).catch(err => {
          console.warn('Recent products failed:', err);
          return { data: [] };
        })
      );

      const [trending, recommended, recent] = await Promise.all(fetchPromises);

      // FIXED: Ensure all data is arrays
      const safeRecommendations = {
        trending: Array.isArray(trending?.data) ? trending.data : [],
        recommended: Array.isArray(recommended?.data) ? recommended.data : [],
        recent: Array.isArray(recent?.data) ? recent.data : []
      };

      console.log('Recommendations loaded:', safeRecommendations);
      setRecommendations(safeRecommendations);

    } catch (error: any) {
      console.error('Failed to fetch recommendations:', error);
      setError(error?.message || 'Failed to load recommendations');
      // Set empty arrays as fallback
      setRecommendations({
        trending: [],
        recommended: [],
        recent: []
      });
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Safe carousel scrolling with proper validation
  const scrollCarousel = (type: string, direction: 'left' | 'right') => {
    const products = recommendations[type];
    if (!Array.isArray(products) || products.length === 0) return;

    const currentIndex = activeCarousels[type] || 0;
    const itemsToShow = 4;
    const maxIndex = Math.max(0, products.length - itemsToShow);
    
    let newIndex;
    if (direction === 'left') {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(maxIndex, currentIndex + 1);
    }
    
    setActiveCarousels(prev => ({ ...prev, [type]: newIndex }));
  };

  // FIXED: Safe Button click handlers
  const handleScrollLeft = (type: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollCarousel(type, 'left');
  };

  const handleScrollRight = (type: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollCarousel(type, 'right');
  };

  const RecommendationCarousel = ({ 
    type, 
    title, 
    icon: Icon, 
    products, 
    description 
  }: {
    type: string;
    title: string;
    icon: any;
    products: Product[];
    description?: string;
  }) => {
    // FIXED: Validate products is an array
    const safeProducts = Array.isArray(products) ? products : [];
    const currentIndex = activeCarousels[type] || 0;
    const itemsToShow = 4;
    const canScrollLeft = currentIndex > 0;
    const canScrollRight = currentIndex < (safeProducts.length - itemsToShow);

    if (loading) {
      return (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Icon className="h-5 w-5" />
                <CardTitle>{title}</CardTitle>
              </div>
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="animate-pulse bg-gray-200 h-48 w-full rounded-lg" />
                  <div className="space-y-2">
                    <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded" />
                    <div className="animate-pulse bg-gray-200 h-4 w-1/2 rounded" />
                    <div className="animate-pulse bg-gray-200 h-6 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (safeProducts.length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle>{title}</CardTitle>
              <Badge variant="secondary">{safeProducts.length}</Badge>
            </div>
            
            {safeProducts.length > itemsToShow && (
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleScrollLeft(type)}
                  disabled={!canScrollLeft}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleScrollRight(type)}
                  disabled={!canScrollRight}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
                width: `${Math.max(100, (safeProducts.length / itemsToShow) * 100)}%`
              }}
            >
              {safeProducts.map((product) => (
                <div 
                  key={product._id} 
                  className="flex-shrink-0 px-2"
                  style={{ width: `${100 / Math.max(itemsToShow, safeProducts.length)}%` }}
                >
                  <ProductCard 
                    product={product}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // FIXED: Safe array access for mobile tabs
  const getSafeSlice = (products: Product[], count: number = 4): Product[] => {
    return Array.isArray(products) ? products.slice(0, count) : [];
  };

  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Recommended for You</h2>
          <p className="text-red-600">Unable to load recommendations: {error}</p>
          <Button onClick={fetchRecommendations} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Recommended for You</h2>
          <p className="text-muted-foreground">Loading personalized recommendations...</p>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse bg-gray-200 h-6 w-48 rounded" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="space-y-3">
                      <div className="animate-pulse bg-gray-200 h-48 w-full rounded-lg" />
                      <div className="space-y-2">
                        <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded" />
                        <div className="animate-pulse bg-gray-200 h-4 w-1/2 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Check if we have any recommendations to show
  const hasAnyRecommendations = 
    recommendations.trending?.length > 0 || 
    recommendations.recommended?.length > 0 || 
    recommendations.recent?.length > 0;

  if (!hasAnyRecommendations) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Recommended for You</h2>
          <p className="text-muted-foreground">No recommendations available at the moment.</p>
          <Button onClick={fetchRecommendations} variant="outline">
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Recommended for You</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover products tailored to your preferences and shopping behavior
        </p>
      </div>

      {/* Personalized Recommendations (for authenticated users) */}
      {isAuthenticated && recommendations.recommended && recommendations.recommended.length > 0 && (
        <RecommendationCarousel
          type="recommended"
          title="Just for You"
          icon={Sparkles}
          products={recommendations.recommended}
          description="Personalized recommendations based on your browsing and purchase history"
        />
      )}

      {/* Trending Products */}
      {recommendations.trending && recommendations.trending.length > 0 && (
        <RecommendationCarousel
          type="trending"
          title="Trending Now"
          icon={TrendingUp}
          products={recommendations.trending}
          description="Popular products that other customers are buying right now"
        />
      )}

      {/* Recently Added */}
      {recommendations.recent && recommendations.recent.length > 0 && (
        <RecommendationCarousel
          type="recent"
          title="New Arrivals"
          icon={Clock}
          products={recommendations.recent}
          description="Latest products added to our catalog"
        />
      )}

      {/* Alternative layout with tabs for mobile */}
      <div className="lg:hidden">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>Discover More</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trending" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trending">Trending</TabsTrigger>
                {isAuthenticated && (
                  <TabsTrigger value="recommended">For You</TabsTrigger>
                )}
                <TabsTrigger value="recent">New</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trending" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSafeSlice(recommendations.trending, 4).map((product) => (
                    <ProductCard 
                      key={product._id}
                      product={product}
                      className="h-full"
                    />
                  ))}
                </div>
              </TabsContent>
              
              {isAuthenticated && (
                <TabsContent value="recommended" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {getSafeSlice(recommendations.recommended, 4).map((product) => (
                      <ProductCard 
                        key={product._id}
                        product={product}
                        className="h-full"
                      />
                    ))}
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="recent" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getSafeSlice(recommendations.recent, 4).map((product) => (
                    <ProductCard 
                      key={product._id}
                      product={product}
                      className="h-full"
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}