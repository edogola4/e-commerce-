// frontend/src/app/(auth)/login/page.tsx - Enhanced with Working reCAPTCHA
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ReCaptcha } from '@/components/ui/recaptcha'; // Import our improved component
import { useForm, useAuth } from '@/hooks';
import { LoginCredentials } from '@/types';
import React from 'react';

// Rate Limiting Hook
const useRateLimit = (maxAttempts: number = 5) => {
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [nextAttemptTime, setNextAttemptTime] = useState<Date | null>(null);

  // Load attempts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('login_attempts');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Check if blocked time has expired
        if (data.blockedUntil && now > data.blockedUntil) {
          localStorage.removeItem('login_attempts');
          return;
        }
        
        // Check if attempt window has expired (15 minutes)
        if (now - data.firstAttempt > 15 * 60 * 1000) {
          localStorage.removeItem('login_attempts');
          return;
        }
        
        setAttempts(data.attempts);
        if (data.blockedUntil && now <= data.blockedUntil) {
          setIsBlocked(true);
          setNextAttemptTime(new Date(data.blockedUntil));
        }
      } catch (error) {
        localStorage.removeItem('login_attempts');
      }
    }
  }, []);

  const recordAttempt = useCallback(() => {
    const now = Date.now();
    const stored = localStorage.getItem('login_attempts');
    let data = { attempts: 1, firstAttempt: now };
    
    if (stored) {
      try {
        const existing = JSON.parse(stored);
        // If within 15 minute window, increment
        if (now - existing.firstAttempt <= 15 * 60 * 1000) {
          data = { ...existing, attempts: existing.attempts + 1 };
        }
      } catch (error) {
        // Use default data
      }
    }
    
    const newAttempts = data.attempts;
    setAttempts(newAttempts);
    
    // Block after max attempts
    if (newAttempts >= maxAttempts) {
      const blockUntil = now + 30 * 60 * 1000; // 30 minutes
      data.blockedUntil = blockUntil;
      setIsBlocked(true);
      setNextAttemptTime(new Date(blockUntil));
      
      // Auto-unblock after timeout
      setTimeout(() => {
        setIsBlocked(false);
        setAttempts(0);
        setNextAttemptTime(null);
        localStorage.removeItem('login_attempts');
      }, 30 * 60 * 1000);
    }
    
    localStorage.setItem('login_attempts', JSON.stringify(data));
    
    return newAttempts;
  }, [maxAttempts]);

  const reset = useCallback(() => {
    setAttempts(0);
    setIsBlocked(false);
    setNextAttemptTime(null);
    localStorage.removeItem('login_attempts');
  }, []);

  return {
    attempts,
    isBlocked,
    nextAttemptTime,
    recordAttempt,
    reset,
    attemptsLeft: Math.max(0, maxAttempts - attempts),
    requiresCaptcha: attempts >= 3
  };
};

// Security Monitor Hook
const useSecurityMonitor = () => {
  const recordEvent = useCallback((event: {
    type: string;
    email?: string;
    success?: boolean;
    metadata?: any;
  }) => {
    const eventData = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Security Event:', eventData);
    }
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'security_event', {
        event_category: 'security',
        event_label: event.type,
        custom_parameters: event.metadata
      });
    }
  }, []);

  return { recordEvent };
};

// Simple validation
const validateLogin = (values: LoginCredentials): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email is invalid';
  }

  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return errors;
};

// Security Monitor Component
const SecurityMonitor = ({ 
  failedAttempts, 
  isBlocked, 
  nextAttemptTime,
  maxAttempts 
}: {
  failedAttempts: number;
  isBlocked: boolean;
  nextAttemptTime?: Date | null;
  maxAttempts: number;
}) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (isBlocked && nextAttemptTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const left = Math.max(0, nextAttemptTime.getTime() - now);
        setTimeLeft(left);
        
        if (left === 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isBlocked, nextAttemptTime]);

  if (failedAttempts === 0) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <Alert variant={isBlocked ? "destructive" : "default"} className="mb-4">
      <Shield className="h-4 w-4" />
      <AlertDescription>
        {isBlocked ? (
          <>
            Too many failed attempts. Please try again in{' '}
            <span className="font-medium">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </>
        ) : (
          <>
            {failedAttempts} failed attempt{failedAttempts > 1 ? 's' : ''}. 
            {' '}{maxAttempts - failedAttempts} attempt{maxAttempts - failedAttempts > 1 ? 's' : ''} remaining.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

// Demo credentials component
const DemoCredentials = ({ 
  onUseDemo, 
  disabled 
}: { 
  onUseDemo: () => void; 
  disabled: boolean;
}) => (
  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Badge variant="secondary" className="text-xs">DEMO</Badge>
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium text-blue-900">Try Demo Account</h4>
          <p className="text-xs text-blue-700">
            Experience the platform with pre-configured demo data
          </p>
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
            <div>Email: demo@ecommercy.co.ke</div>
            <div>Password: demo123</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onUseDemo}
            disabled={disabled}
            className="text-blue-700 border-blue-300 hover:bg-blue-100 w-full"
          >
            Use Demo Account
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Main login component
export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = decodeURIComponent(searchParams.get('redirect') || '/');
  const fromRegistration = searchParams.get('from') === 'registration';
  
  const { login, isAuthenticated, isLoading, error: authError, clearError } = useAuth();
  const { recordEvent } = useSecurityMonitor();
  const { 
    attempts: failedAttempts, 
    isBlocked, 
    nextAttemptTime, 
    recordAttempt,
    reset: resetRateLimit,
    requiresCaptcha,
    attemptsLeft
  } = useRateLimit(5);

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit  } = useForm<LoginCredentials>(
    { email: '', password: '' },
    validateLogin
  );

  // Clear errors when user starts typing
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [authError, clearError]);

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      recordEvent({
        type: 'login_success',
        email: values.email,
        success: true,
        metadata: { 
          redirectUrl: redirectUrl !== '/' ? redirectUrl : undefined,
          fromRegistration,
          usedCaptcha: !!captchaToken
        }
      });
      router.replace(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl, fromRegistration, recordEvent, values.email, captchaToken]);

  const handleDemoLogin = useCallback(async () => {
    if (isBlocked) return;
    
    setIsSubmitting(true);
    try {
      await login({
        email: 'demo@ecommercy.co.ke',
        password: 'demo123'
      });
      
      recordEvent({
        type: 'demo_login_attempt',
        success: true,
        metadata: { email: 'demo@ecommercy.co.ke' }
      });
    } catch (error) {
      recordEvent({
        type: 'demo_login_attempt',
        success: false,
        metadata: { email: 'demo@ecommercy.co.ke', error: (error as Error).message }
      });
      console.error('Demo login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [login, isBlocked, recordEvent]);

  const handleCaptchaChange = useCallback((token: string | null) => {
    console.log('🔒 Captcha token received:', token ? 'Present' : 'Null');
    setCaptchaToken(token);
    setCaptchaError(null);
  }, []);

  const handleCaptchaError = useCallback((error: string) => {
    console.log('🔒 Captcha error:', error);
    setCaptchaError(error);
    setCaptchaToken(null);
    recordEvent({
      type: 'captcha_error',
      metadata: { error }
    });
  }, [recordEvent]);

  const handleCaptchaExpired = useCallback(() => {
    console.log('🔒 Captcha expired');
    setCaptchaToken(null);
    setCaptchaError('Security verification expired. Please complete it again.');
  }, []);

  const onSubmit = useCallback(async (formData: LoginCredentials) => {
    if (isBlocked) {
      console.log('🔒 Login blocked due to rate limiting');
      return;
    }
    
    // Check reCAPTCHA if required
    if (requiresCaptcha && !captchaToken) {
      setCaptchaError('Please complete the security verification before continuing');
      console.log('🔒 Login blocked: reCAPTCHA required but not completed');
      return;
    }
    
    setIsSubmitting(true);
    console.log('🔒 Attempting login with:', {
      email: formData.email,
      requiresCaptcha,
      hasCaptcha: !!captchaToken,
      attemptNumber: failedAttempts + 1
    });
    
    try {
      recordEvent({
        type: 'login_attempt',
        email: formData.email,
        metadata: { 
          requiresCaptcha,
          hasCaptcha: !!captchaToken,
          attemptNumber: failedAttempts + 1
        }
      });

      // Include captcha token in login request
      const loginPayload = {
        ...formData,
        rememberMe,
        ...(requiresCaptcha && captchaToken && { captchaToken })
      };

      await login(loginPayload);
      
      // Clear attempts on successful login
      resetRateLimit();
      console.log('🔒 Login successful');
      
    } catch (error) {
      // Record failed attempt
      const newAttempts = recordAttempt();
      
      recordEvent({
        type: 'login_failure',
        email: formData.email,
        success: false,
        metadata: { 
          error: (error as Error).message,
          attemptNumber: newAttempts,
          willRequireCaptcha: newAttempts >= 3
        }
      });
      
      // Reset captcha on failed attempt if it was required
      if (requiresCaptcha) {
        setCaptchaToken(null);
        setCaptchaError(null);
      }
      
      console.error('🔒 Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [login, rememberMe, isBlocked, requiresCaptcha, captchaToken, recordAttempt, resetRateLimit, recordEvent, failedAttempts]);

  const handlePasswordToggle = useCallback(() => {
    setShowPassword(prev => !prev);
    recordEvent({ type: 'password_visibility_toggled' });
  }, [recordEvent]);

  // Form validation including captcha
  const canSubmit = useMemo(() => {
    const hasBasicFields = values.email?.trim() && values.password?.trim();
    const notBlocked = !isBlocked;
    const notSubmitting = !isSubmitting && !isLoading;
    const hasCaptchaIfRequired = !requiresCaptcha || captchaToken;
    const noValidationErrors = Object.keys(errors).length === 0;
    
    return hasBasicFields && notBlocked && notSubmitting && hasCaptchaIfRequired && noValidationErrors;
  }, [values.email, values.password, isBlocked, isSubmitting, isLoading, requiresCaptcha, captchaToken, errors]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ECommercy
            </span>
          </Link>
        </div>

        {/* Success message from registration */}
        {fromRegistration && (
          <Alert className="border-green-200 bg-green-50">
            <AlertTriangle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Registration successful! Please sign in to your account.
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Monitor */}
            <SecurityMonitor 
              failedAttempts={failedAttempts}
              isBlocked={isBlocked}
              nextAttemptTime={nextAttemptTime}
              maxAttempts={5}
            />

            {/* reCAPTCHA Required Notice */}
            {requiresCaptcha && !isBlocked && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Additional security verification is required due to multiple failed login attempts.
                </AlertDescription>
              </Alert>
            )}

            {/* Login Error */}
            {authError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (canSubmit) {
                  handleSubmit(onSubmit);
                }
              }} 
              className="space-y-4"
              noValidate
            >
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                  <span className="text-destructive ml-1">*</span>
                </Label>
                
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={values.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    disabled={isSubmitting || isLoading || isBlocked}
                    className={`pl-10 ${touched.email && errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    autoComplete="email"
                    required
                  />
                </div>
                
                {touched.email && errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                  <span className="text-destructive ml-1">*</span>
                </Label>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={values.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    onBlur={() => handleBlur('password')}
                    disabled={isSubmitting || isLoading || isBlocked}
                    className={`pl-10 pr-10 ${touched.password && errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    autoComplete="current-password"
                    required
                  />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={handlePasswordToggle}
                    tabIndex={-1}
                    disabled={isBlocked}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {touched.password && errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* reCAPTCHA */}
              {requiresCaptcha && !isBlocked && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Security Verification
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <ReCaptcha
                    onChange={handleCaptchaChange}
                    onError={handleCaptchaError}
                    onExpired={handleCaptchaExpired}
                    theme="light"
                    size="normal"
                  />
                  {captchaError && (
                    <p className="text-sm text-destructive" role="alert">
                      {captchaError}
                    </p>
                  )}
                </div>
              )}

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isBlocked}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="remember-me" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={!canSubmit}
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground text-center space-y-1 p-2 bg-gray-50 rounded">
                  <div>Attempts: {failedAttempts}/5 | Blocked: {isBlocked ? '✓' : '✗'} | Captcha Required: {requiresCaptcha ? '✓' : '✗'}</div>
                  <div>Can Submit: {canSubmit ? '✓' : '✗'} | Has Captcha: {captchaToken ? '✓' : '✗'} | Has Errors: {Object.keys(errors).length > 0 ? '✓' : '✗'}</div>
                </div>
              )}
            </form>

            {/* Demo Account */}
            {!requiresCaptcha && (
              <DemoCredentials 
                onUseDemo={handleDemoLogin}
                disabled={isSubmitting || isLoading || isBlocked}
              />
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Separator />
            <div className="text-center text-sm">
              Don't have an account?{' '}
              <Link
                href={`/auth/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
                className="text-primary hover:underline font-medium"
              >
                Create account
              </Link>
            </div>
          </CardFooter>
        </Card>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="/legal/terms" className="hover:underline font-medium">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="hover:underline font-medium">
            Privacy Policy
          </Link>
        </p>

        {/* Security Notice */}
        <div className="text-center text-xs text-muted-foreground bg-white/50 rounded-lg p-3">
          <Shield className="h-4 w-4 inline mr-1" />
          Your connection is secured with 256-bit SSL encryption
        </div>
      </div>
    </div>
  );
}