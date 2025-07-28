'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Users, 
  Clock,
  Crown,
  Star,
  Heart,
  Zap,
  Target,
  Award,
  RefreshCw,
  AlertCircle,
  Eye,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductCard } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { cn } from '@/lib/utils';

export function RecommendationsSection() {
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
      setRecommendations({
        trending: [],
        recommended: [],
        recent: []
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleScrollLeft = (type: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollCarousel(type, 'left');
  };

  const handleScrollRight = (type: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    scrollCarousel(type, 'right');
  };

  // Enhanced Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4 animate-pulse">
        <div className="h-12 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-2xl w-80 mx-auto"></div>
        <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl w-96 mx-auto"></div>
      </div>

      {/* Carousel skeletons */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-xl animate-pulse"></div>
                <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-32 animate-pulse"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg animate-pulse"></div>
                <div className="h-8 w-8 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 aspect-square rounded-2xl animate-pulse" />
                  <div className="space-y-3">
                    <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-3/4 animate-pulse" />
                    <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-1/2 animate-pulse" />
                    <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 rounded-lg w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const RecommendationCarousel = ({ 
    type, 
    title, 
    icon: Icon, 
    products, 
    description,
    gradient,
    badge 
  }: {
    type: string;
    title: string;
    icon: any;
    products: Product[];
    description?: string;
    gradient?: string;
    badge?: string;
  }) => {
    const safeProducts = Array.isArray(products) ? products : [];
    const currentIndex = activeCarousels[type] || 0;
    const itemsToShow = 4;
    const canScrollLeft = currentIndex > 0;
    const canScrollRight = currentIndex < (safeProducts.length - itemsToShow);

    if (safeProducts.length === 0) {
      return null;
    }

    return (
      <Card 
        className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
        style={{
          animation: 'fadeInUp 0.8s ease-out forwards'
        }}
      >
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300",
                gradient || "bg-gradient-to-br from-blue-500 to-purple-600"
              )}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {title}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {safeProducts.length}
                  </Badge>
                  {badge && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none animate-pulse">
                      {badge}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-lg">
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {safeProducts.length > itemsToShow && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group/btn"
                  onClick={handleScrollLeft(type)}
                  disabled={!canScrollLeft}
                >
                  <ChevronLeft className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 group/btn"
                  onClick={handleScrollRight(type)}
                  disabled={!canScrollRight}
                >
                  <ChevronRight className="h-5 w-5 group-hover/btn:scale-110 transition-transform duration-300" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ 
                transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
                width: `${Math.max(100, (safeProducts.length / itemsToShow) * 100)}%`
              }}
            >
              {safeProducts.map((product, index) => (
                <div 
                  key={product._id} 
                  className="flex-shrink-0 px-3 group/product"
                  style={{ 
                    width: `${100 / Math.max(itemsToShow, safeProducts.length)}%` 
                  }}
                >
                  <div className="relative">
                    {/* Product rank badge for trending */}
                    {type === 'trending' && index < 3 && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg",
                          index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                          index === 1 ? "bg-gradient-to-r from-gray-400 to-gray-500" :
                          "bg-gradient-to-r from-amber-600 to-yellow-600"
                        )}>
                          {index + 1}
                        </div>
                      </div>
                    )}
                    
                    {/* Special badges */}
                    {type === 'recommended' && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none px-2 py-1 rounded-xl font-bold shadow-lg">
                          <Heart className="w-3 h-3 mr-1 fill-current" />
                          For You
                        </Badge>
                      </div>
                    )}
                    
                    <ProductCard 
                      product={product}
                      className="h-full transition-all duration-300 group-hover/product:scale-105"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel indicators */}
          {safeProducts.length > itemsToShow && (
            <div className="flex justify-center space-x-2 mt-6">
              {Array.from({ length: Math.ceil(safeProducts.length / itemsToShow) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCarousels(prev => ({ ...prev, [type]: index }))}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    currentIndex === index 
                      ? "bg-blue-600 w-6" 
                      : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  )}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const getSafeSlice = (products: Product[], count: number = 4): Product[] => {
    return Array.isArray(products) ? products.slice(0, count) : [];
  };

  // Enhanced Error State
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="max-w-lg mx-auto">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-orange-500 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Recommendations Unavailable
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-8 leading-relaxed">
              {error}
            </p>
            
            <Button 
              onClick={fetchRecommendations}
              className="h-12 px-6 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Check if we have any recommendations
  const hasAnyRecommendations = 
    recommendations.trending?.length > 0 || 
    recommendations.recommended?.length > 0 || 
    recommendations.recent?.length > 0;

  if (!hasAnyRecommendations) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="max-w-lg mx-auto">
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                <Target className="w-12 h-12 text-blue-500" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-purple-500 animate-pulse" />
            </div>
            
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Building Your Recommendations
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              We're learning your preferences to create personalized recommendations. Start browsing to help us understand what you love!
            </p>
            
            <Button 
              onClick={fetchRecommendations}
              className="h-12 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
            >
              <RefreshCw className="mr-2 h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
              Refresh Recommendations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Enhanced Section Header */}
      <div className="text-center space-y-6 animate-in slide-in-from-top duration-700">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-sm">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 text-white" />
          </div>
          <span className="font-bold text-lg">Personalized for You</span>
          <Target className="w-5 h-5 animate-pulse" />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-slate-100 dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight">
            Recommended for You
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Discover products tailored to your preferences and shopping behavior. 
            <span className="font-semibold text-blue-600 dark:text-blue-400"> AI-powered recommendations just for you.</span>
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-700 delay-200">
        {[
          { icon: Eye, label: 'Personalized', value: '100%', color: 'from-blue-500 to-purple-600' },
          { icon: TrendingUp, label: 'Trending Items', value: recommendations.trending?.length || 0, color: 'from-green-500 to-emerald-600' },
          { icon: Clock, label: 'New Arrivals', value: recommendations.recent?.length || 0, color: 'from-orange-500 to-red-500' },
          { icon: Heart, label: 'Just for You', value: recommendations.recommended?.length || 0, color: 'from-pink-500 to-purple-500' },
        ].map((stat, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex items-center space-x-4">
              <div className={`h-12 w-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stat.value}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation Carousels */}
      <div className="space-y-8">
        {/* Personalized Recommendations (for authenticated users) */}
        {isAuthenticated && recommendations.recommended && recommendations.recommended.length > 0 && (
          <RecommendationCarousel
            type="recommended"
            title="Just for You"
            icon={Crown}
            products={recommendations.recommended}
            description="Personalized recommendations based on your browsing and purchase history"
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
            badge="Premium"
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
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            badge="🔥 Hot"
          />
        )}

        {/* Recently Added */}
        {recommendations.recent && recommendations.recent.length > 0 && (
          <RecommendationCarousel
            type="recent"
            title="New Arrivals"
            icon={Clock}
            products={recommendations.recent}
            description="Latest products added to our catalog - be the first to discover them"
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            badge="✨ New"
          />
        )}
      </div>

      {/* Enhanced Mobile Tabs */}
      <div className="lg:hidden">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl">Discover More</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trending" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-700 rounded-2xl p-2">
                <TabsTrigger 
                  value="trending"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                {isAuthenticated && (
                  <TabsTrigger 
                    value="recommended"
                    className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    For You
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="recent"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  New
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="trending" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {getSafeSlice(recommendations.trending, 4).map((product, index) => (
                    <div key={product._id} className="relative">
                      {index < 2 && (
                        <div className="absolute -top-2 -left-2 z-20">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg",
                            index === 0 ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-gray-400 to-gray-500"
                          )}>
                            {index + 1}
                          </div>
                        </div>
                      )}
                      <ProductCard 
                        product={product}
                        className="h-full"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              {isAuthenticated && (
                <TabsContent value="recommended" className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {getSafeSlice(recommendations.recommended, 4).map((product) => (
                      <div key={product._id} className="relative">
                        <div className="absolute -top-2 -right-2 z-20">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none px-2 py-1 rounded-xl font-bold shadow-lg">
                            <Heart className="w-3 h-3 mr-1 fill-current" />
                            For You
                          </Badge>
                        </div>
                        <ProductCard 
                          product={product}
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}
              
              <TabsContent value="recent" className="mt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {getSafeSlice(recommendations.recent, 4).map((product) => (
                    <div key={product._id} className="relative">
                      <div className="absolute -top-2 -right-2 z-20">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-none px-2 py-1 rounded-xl font-bold shadow-lg">
                          <Sparkles className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      </div>
                      <ProductCard 
                        product={product}
                        className="h-full"
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}