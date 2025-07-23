'use client';

import { Shield, Award, Users, Truck, Headphones, Repeat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function TrustSection() {
  const trustIndicators = [
    {
      icon: Shield,
      title: 'Secure Shopping',
      description: '256-bit SSL encryption protects your data',
      stat: '100% Secure',
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-600',
      statBg: 'bg-blue-100 text-blue-800',
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      description: 'All products verified for authenticity',
      stat: '5-Star Quality',
      color: 'from-amber-500/20 to-amber-600/20',
      iconColor: 'text-amber-600',
      statBg: 'bg-amber-100 text-amber-800',
    },
    {
      icon: Users,
      title: 'Trusted by Thousands',
      description: 'Join our growing community of satisfied customers',
      stat: '50K+ Customers',
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-600',
      statBg: 'bg-purple-100 text-purple-800',
    },
    {
      icon: Truck,
      title: 'Fast Delivery',
      description: 'Same-day delivery in Nairobi, nationwide shipping',
      stat: '24-48hr Delivery',
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-600',
      statBg: 'bg-green-100 text-green-800',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Our customer service team is always here to help',
      stat: 'Always Available',
      color: 'from-rose-500/20 to-rose-600/20',
      iconColor: 'text-rose-600',
      statBg: 'bg-rose-100 text-rose-800',
    },
    {
      icon: Repeat,
      title: 'Easy Returns',
      description: '30-day hassle-free return policy',
      stat: '30-Day Returns',
      color: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-600',
      statBg: 'bg-indigo-100 text-indigo-800',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah K.',
      location: 'Nairobi',
      review: 'Amazing service! Got my electronics delivered the same day. Quality products and great prices.',
      rating: 5,
      avatar: 'S',
    },
    {
      name: 'John M.',
      location: 'Mombasa',
      review: 'Best online shopping experience in Kenya. Customer support is outstanding.',
      rating: 5,
      avatar: 'J',
    },
    {
      name: 'Grace W.',
      location: 'Kisumu',
      review: 'Love the variety of products and the recommendation system helped me find exactly what I needed.',
      rating: 5,
      avatar: 'G',
    },
  ];

  return (
    <div className="w-full">
      {/* Trust Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {trustIndicators.map((indicator, index) => {
          const Icon = indicator.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden"
            >
              <Card className="h-full border-0 shadow-soft hover:shadow-medium transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                  <div>
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${indicator.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-10 w-10 ${indicator.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                      {indicator.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {indicator.description}
                    </p>
                  </div>
                  <div className={`inline-flex items-center px-4 py-2 ${indicator.statBg} rounded-full text-sm font-semibold transition-all duration-300 group-hover:scale-105`}>
                    {indicator.stat}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Customer Testimonials */}
      <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-3xl p-8 md:p-12">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4 text-gradient">
            What Our Customers Say
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied customers across Kenya
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8">
                {/* Rating Stars */}
                <div className="flex justify-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg 
                      key={i} 
                      className="w-5 h-5 text-amber-400 fill-current" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Review Text */}
                <blockquote className="text-center mb-8">
                  <p className="text-muted-foreground italic text-lg leading-relaxed">
                    "{testimonial.review}"
                  </p>
                </blockquote>

                {/* Customer Info */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-medium">
                    <span className="text-primary-foreground font-bold text-lg">
                      {testimonial.avatar}
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-6 py-3 rounded-full font-semibold">
            <Users className="w-5 h-5" />
            <span>Join over 10,000 subscribers and get 10% off your first order</span>
          </div>
        </div>
      </div>
    </div>
  );
}