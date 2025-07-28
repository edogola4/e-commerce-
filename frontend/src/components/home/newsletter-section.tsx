'use client';

import { useState } from 'react';
import { 
  Mail, 
  Gift, 
  Bell, 
  Star,
  Send,
  Check,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  Users,
  Award,
  Lock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks';
import { api } from '@/lib/api';
import { isValidEmail, cn } from '@/lib/utils';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      error('Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.newsletter.subscribe(email, {
        deals: true,
        newProducts: true,
        newsletter: true,
      });
      
      setIsSuccess(true);
      success('Successfully subscribed! Welcome to our community 🎉');
      setEmail('');
      
      // Reset success state after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err) {
      error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Gift,
      title: 'Exclusive Deals',
      description: 'Get early access to sales and VIP-only discounts up to 70% off',
      color: 'from-rose-400 via-pink-500 to-purple-600',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
    },
    {
      icon: Bell,
      title: 'New Arrivals',
      description: 'Be the first to discover trending products before they sell out',
      color: 'from-indigo-400 via-blue-500 to-cyan-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    },
    {
      icon: Star,
      title: 'Personalized Picks',
      description: 'AI-curated product recommendations tailored to your interests',
      color: 'from-amber-400 via-orange-500 to-red-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ];

  const features = [
    { icon: Zap, text: 'Instant notifications' },
    { icon: Shield, text: 'Privacy protected' },
    { icon: Heart, text: 'No spam promise' },
    { icon: Gift, text: '10% welcome bonus' },
  ];

  const stats = [
    { value: '25,000+', label: 'Subscribers', icon: Users },
    { value: '50,000+', label: 'Happy Customers', icon: Heart },
    { value: '4.9★', label: 'Satisfaction Rate', icon: Star },
    { value: '24/7', label: 'Support', icon: Award },
  ];

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/80 via-purple-900/80 to-indigo-900/80"></div>
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-violet-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-purple-500/40 rounded-full blur-2xl animate-ping delay-500"></div>
      </div>

      <div className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-16 animate-in slide-in-from-top duration-700">
              <div className="inline-flex items-center space-x-3 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl px-6 py-3 mb-8 shadow-2xl">
                <div className="h-10 w-10 bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">Newsletter</span>
                <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black mb-6 text-white leading-tight drop-shadow-lg">
                Stay in the
                <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent"> Loop</span>
              </h2>
              <p className="text-xl text-white/95 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
                Join our exclusive community and unlock VIP access to the best deals, 
                <span className="font-semibold text-amber-200"> newest products, and insider perks</span>
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    <feature.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Newsletter Form */}
            <div className="max-w-2xl mx-auto mb-16 animate-in slide-in-from-bottom duration-700 delay-200">
              <Card className="bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                      <Input
                        type="email"
                        placeholder="Enter your email for exclusive access..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 bg-white/90 dark:bg-slate-800/90 border-white/30 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 rounded-2xl text-lg backdrop-blur-sm transition-all duration-300"
                        disabled={isSubmitting}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting || isSuccess}
                      className={cn(
                        "w-full h-14 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 group",
                        isSuccess 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" 
                          : "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white hover:scale-105"
                      )}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Subscribing...</span>
                        </div>
                      ) : isSuccess ? (
                        <div className="flex items-center space-x-3">
                          <Check className="h-5 w-5" />
                          <span>Successfully Subscribed!</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                          <span>Join Our Community</span>
                          <Sparkles className="h-5 w-5 group-hover:scale-125 transition-transform duration-300" />
                        </div>
                      )}
                    </Button>
                  </form>
                  
                  <div className="text-center mt-6">
                    <Badge className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white border-none px-4 py-2 rounded-xl font-bold shadow-lg">
                      <Gift className="w-4 h-4 mr-2" />
                      Get 10% OFF your first order instantly!
                    </Badge>
                    <p className="text-sm text-white/90 mt-3">
                      Join over 25,000 smart shoppers already saving with us
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index}
                  className="group bg-white/20 backdrop-blur-xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                  style={{
                    animationDelay: `${index * 200}ms`,
                    animation: 'fadeInUp 0.8s ease-out forwards'
                  }}
                >
                  <CardContent className="p-8 text-center text-white">
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 bg-gradient-to-br ${benefit.color} rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <benefit.icon className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-amber-900" />
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-amber-300 transition-colors duration-300">
                      {benefit.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed group-hover:text-white transition-colors duration-300">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enhanced Social Proof */}
            <div className="animate-in slide-in-from-bottom duration-700 delay-500">
              <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">Trusted by Thousands</h3>
                  <p className="text-white/90">Join our growing community of satisfied customers</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat, index) => (
                    <div 
                      key={index}
                      className="text-center group hover:scale-110 transition-transform duration-300"
                    >
                      <div className="flex items-center justify-center mb-3">
                        <div className="h-12 w-12 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/40 group-hover:bg-white/40 transition-colors duration-300">
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-white mb-1 drop-shadow-md">{stat.value}</div>
                      <div className="text-sm text-white/80 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Privacy Notice */}
            <div className="text-center mt-12 animate-in slide-in-from-bottom duration-700 delay-700">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-2xl mx-auto">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <Lock className="h-5 w-5 text-white" />
                  <span className="font-semibold text-white">Your Privacy Matters</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  We respect your privacy and will never spam you. You can unsubscribe at any time with one click. 
                  Read our{' '}
                  <a 
                    href="/privacy" 
                    className="text-amber-200 hover:text-amber-100 underline hover:no-underline transition-colors duration-300 inline-flex items-center"
                  >
                    Privacy Policy
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                  {' '}for more details.
                </p>
                
                <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-white/80">
                  <span className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>GDPR Compliant</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Lock className="h-3 w-3" />
                    <span>SSL Secured</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart className="h-3 w-3" />
                    <span>No Spam</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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