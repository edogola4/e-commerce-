'use client';
import { useEffect } from 'react';
import { HeroSection } from '@/components/home/hero-section';
import { FeaturedProducts } from '@/components/home/featured-products';
import { CategoryGrid } from '@/components/home/category-grid';
import { DealsSection } from '@/components/home/deals-section';
import { RecommendationsSection } from '@/components/home/recommendations-section';
import { NewsletterSection } from '@/components/home/newsletter-section';
import { TrustSection } from '@/components/home/trust-section';
import { useProductsStore } from '@/store';

export default function HomePage() {
  const { fetchFeaturedProducts, fetchCategories } = useProductsStore();

  useEffect(() => {
    // Fetch initial data
    fetchFeaturedProducts();
    fetchCategories();
  }, [fetchFeaturedProducts, fetchCategories]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="animate-fade-in">
        <HeroSection />
      </div>

      {/* Categories Grid */}
      <section className="section bg-background">
        <div className="container">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-responsive-lg font-bold mb-4 text-gradient">
              Shop by Category
            </h2>
            <p className="text-muted-foreground text-responsive-md max-w-2xl mx-auto">
              Discover our wide range of products across different categories
            </p>
          </div>
          <div className="animate-slide-up">
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section bg-muted/30">
        <div className="container">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-responsive-lg font-bold mb-4">
              Featured Products
            </h2>
            <p className="text-muted-foreground text-responsive-md max-w-2xl mx-auto">
              Hand-picked products that our customers love most
            </p>
          </div>
          <div className="animate-slide-up">
            <FeaturedProducts />
          </div>
        </div>
      </section>

      {/* Deals Section */}
      <section className="section bg-background">
        <div className="container">
          <div className="animate-slide-up">
            <DealsSection />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="section bg-muted/20">
        <div className="container">
          <div className="text-center mb-12 animate-slide-up">
            <h2 className="text-responsive-lg font-bold mb-4">
              Why Choose Us
            </h2>
            <p className="text-muted-foreground text-responsive-md max-w-2xl mx-auto">
              We're committed to providing you with the best shopping experience
            </p>
          </div>
          <div className="animate-slide-up">
            <TrustSection />
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="section bg-background">
        <div className="container">
          <div className="animate-slide-up">
            <RecommendationsSection />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-sm bg-background">
        <div className="container">
          <div className="animate-slide-up">
            <NewsletterSection />
          </div>
        </div>
      </section>
    </div>
  );
}