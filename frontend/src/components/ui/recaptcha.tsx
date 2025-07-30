// src/components/ui/recaptcha.tsx - Complete Working Implementation
'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Shield, CheckCircle } from 'lucide-react';

interface ReCaptchaProps {
  onChange: (token: string | null) => void;
  onError?: (error: string) => void;
  onExpired?: () => void;
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal';
  className?: string;
  siteKey?: string; // Allow override for testing
}

declare global {
  interface Window {
    grecaptcha: any;
    recaptchaCallback: (token: string) => void;
    recaptchaErrorCallback: () => void;
    recaptchaExpiredCallback: () => void;
    recaptchaOnLoad: () => void;
  }
}

export function ReCaptcha({
  onChange,
  onError,
  onExpired,
  theme = 'light',
  size = 'normal',
  className = '',
  siteKey: propSiteKey
}: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);
  const [isScriptLoading, setIsScriptLoading] = useState(false);

  // Use provided siteKey or environment variable, fallback to test key for development
  const siteKey = propSiteKey || 
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 
    '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Google's test key

  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 reCAPTCHA: ${message}`, data || '');
    }
  };

  const handleSuccess = useCallback((token: string) => {
    debugLog('Token received successfully', { 
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...' 
    });
    setCurrentToken(token);
    setIsVerified(true);
    setIsError(false);
    setErrorMessage('');
    onChange(token);
  }, [onChange]);

  const handleError = useCallback((error?: string) => {
    const errorMsg = error || 'reCAPTCHA verification failed. Please try again.';
    debugLog('Error occurred', errorMsg);
    setCurrentToken(null);
    setIsVerified(false);
    setIsError(true);
    setErrorMessage(errorMsg);
    onChange(null);
    onError?.(errorMsg);
  }, [onChange, onError]);

  const handleExpired = useCallback(() => {
    debugLog('Token expired');
    setCurrentToken(null);
    setIsVerified(false);
    setIsError(false);
    onChange(null);
    onExpired?.();
  }, [onChange, onExpired]);

  // Set up global callbacks with unique names to avoid conflicts
  useEffect(() => {
    const callbackId = Math.random().toString(36).substr(2, 9);
    
    const successCallback = `recaptchaCallback_${callbackId}`;
    const errorCallback = `recaptchaErrorCallback_${callbackId}`;
    const expiredCallback = `recaptchaExpiredCallback_${callbackId}`;

    (window as any)[successCallback] = handleSuccess;
    (window as any)[errorCallback] = () => handleError();
    (window as any)[expiredCallback] = handleExpired;

    // Store callback names for cleanup and rendering
    (window as any).currentCallbacks = {
      success: successCallback,
      error: errorCallback,
      expired: expiredCallback
    };

    return () => {
      delete (window as any)[successCallback];
      delete (window as any)[errorCallback];
      delete (window as any)[expiredCallback];
    };
  }, [handleSuccess, handleError, handleExpired]);

  const renderCaptcha = useCallback(() => {
    if (!window.grecaptcha || !containerRef.current || !siteKey) {
      debugLog('Cannot render - missing dependencies', {
        grecaptcha: !!window.grecaptcha,
        container: !!containerRef.current,
        siteKey: !!siteKey
      });
      return;
    }

    try {
      // Reset state
      setCurrentToken(null);
      setIsVerified(false);
      setIsError(false);
      setErrorMessage('');

      // Clear existing widget
      if (widgetIdRef.current !== null) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
          debugLog('Reset previous widget', { widgetId: widgetIdRef.current });
        } catch (resetError) {
          debugLog('Error resetting widget (this is normal)', resetError);
        }
      }

      // Clear container
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      debugLog('Rendering new widget', { 
        siteKey: siteKey.substring(0, 20) + '...',
        theme,
        size
      });

      const callbacks = (window as any).currentCallbacks;
      
      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: callbacks?.success || 'recaptchaCallback',
        'error-callback': callbacks?.error || 'recaptchaErrorCallback', 
        'expired-callback': callbacks?.expired || 'recaptchaExpiredCallback',
        theme,
        size
      });

      debugLog('Widget rendered successfully', { widgetId: widgetIdRef.current });
      setIsLoaded(true);

    } catch (error) {
      debugLog('Render error', error);
      handleError('Failed to initialize reCAPTCHA widget');
    }
  }, [siteKey, theme, size, handleError]);

  const loadScript = useCallback(() => {
    // Check if reCAPTCHA is already available
    if (window.grecaptcha && window.grecaptcha.render) {
      debugLog('reCAPTCHA already available, rendering immediately');
      if (window.grecaptcha.ready) {
        window.grecaptcha.ready(renderCaptcha);
      } else {
        renderCaptcha();
      }
      return;
    }

    // Check if script is already loading/loaded
    if (document.querySelector('script[src*="recaptcha"]') || isScriptLoading) {
      debugLog('reCAPTCHA script already exists or loading');
      return;
    }

    debugLog('Loading reCAPTCHA script');
    setIsScriptLoading(true);

    // Global onload callback
    window.recaptchaOnLoad = () => {
      debugLog('reCAPTCHA script loaded via global callback');
      setIsScriptLoading(false);
      if (window.grecaptcha && window.grecaptcha.ready) {
        window.grecaptcha.ready(() => {
          debugLog('reCAPTCHA ready');
          renderCaptcha();
        });
      } else {
        setTimeout(renderCaptcha, 100);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=recaptchaOnLoad&render=explicit';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      debugLog('Script onload event fired');
      setIsScriptLoading(false);
    };
    
    script.onerror = () => {
      debugLog('Script load error');
      setIsScriptLoading(false);
      handleError('Failed to load reCAPTCHA script. Please check your internet connection.');
    };

    document.head.appendChild(script);
  }, [renderCaptcha, handleError, isScriptLoading]);

  const resetCaptcha = useCallback(() => {
    debugLog('Manual reset requested');
    setCurrentToken(null);
    setIsVerified(false);
    setIsError(false);
    setErrorMessage('');
    
    if (window.grecaptcha && widgetIdRef.current !== null) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
        onChange(null);
        debugLog('Widget reset successfully');
      } catch (error) {
        debugLog('Reset error, re-rendering widget', error);
        setIsLoaded(false);
        setTimeout(renderCaptcha, 100);
      }
    } else {
      debugLog('Re-rendering widget due to missing grecaptcha or widget');
      setIsLoaded(false);
      setTimeout(renderCaptcha, 100);
    }
  }, [onChange, renderCaptcha]);

  // Manual token verification as backup
  const verifyToken = useCallback(() => {
    if (!window.grecaptcha || widgetIdRef.current === null) return;
    
    try {
      const response = window.grecaptcha.getResponse(widgetIdRef.current);
      
      if (response && response !== currentToken) {
        debugLog('Found new token via manual check', { 
          tokenPreview: response.substring(0, 20) + '...' 
        });
        handleSuccess(response);
      }
    } catch (error) {
      debugLog('Manual verification error', error);
    }
  }, [currentToken, handleSuccess]);

  // Periodic token check as fallback (only when loaded but not verified)
  useEffect(() => {
    if (!isLoaded || isVerified || isError) return;

    const interval = setInterval(verifyToken, 2000);
    return () => clearInterval(interval);
  }, [isLoaded, isVerified, isError, verifyToken]);

  // Initialize reCAPTCHA
  useEffect(() => {
    if (!siteKey) {
      handleError('reCAPTCHA site key not configured');
      return;
    }

    const timer = setTimeout(loadScript, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
        } catch (error) {
          debugLog('Cleanup error (this is normal)', error);
        }
      }
    };
  }, [siteKey, loadScript, handleError]);

  // Show configuration error
  if (!siteKey || siteKey === 'your-site-key-here') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          reCAPTCHA site key not configured. Please add NEXT_PUBLIC_RECAPTCHA_SITE_KEY to your environment variables.
          <br />
          <small className="text-xs opacity-75 mt-1 block">
            Currently using test key for development.
          </small>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col items-center space-y-3">
        
        {/* reCAPTCHA Container */}
        <div 
          ref={containerRef} 
          className="flex justify-center items-center border border-gray-200 rounded"
          style={{ 
            minHeight: size === 'compact' ? '144px' : '78px',
            minWidth: size === 'compact' ? '164px' : '304px',
            backgroundColor: theme === 'dark' ? '#2d3748' : '#ffffff'
          }}
        />

        {/* Loading State */}
        {(isScriptLoading || (!isLoaded && !isError)) && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span>Loading security verification...</span>
          </div>
        )}

        {/* Success State */}
        {isVerified && currentToken && (
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded">
            <CheckCircle className="h-4 w-4" />
            <span>Security verification completed successfully</span>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive" className="max-w-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="text-sm">{errorMessage}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={resetCaptcha}
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Development Debug Panel */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground text-center space-y-1 p-2 bg-gray-50 rounded border max-w-sm">
            <div className="font-medium">Debug Info:</div>
            <div>Status: {isVerified ? '✅ Verified' : isError ? '❌ Error' : isScriptLoading ? '⏳ Loading Script' : '⏳ Waiting'}</div>
            <div>Token: {currentToken ? '✅ Present' : '❌ Missing'} | Widget: {widgetIdRef.current !== null ? `✅ ID:${widgetIdRef.current}` : '❌ None'}</div>
            <div>Site Key: {siteKey.substring(0, 20)}...</div>
            {currentToken && <div className="text-xs break-all">Token: {currentToken.substring(0, 30)}...</div>}
          </div>
        )}
      </div>

      {/* Manual verification button for debugging */}
      {process.env.NODE_ENV === 'development' && isLoaded && !isVerified && !isError && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={verifyToken}
            className="text-xs"
          >
            Manual Token Check
          </Button>
        </div>
      )}

      {/* Required Notice */}
      <p className="text-xs text-muted-foreground text-center">
        <span className="text-destructive">*</span> Please complete the security verification above to continue
      </p>

      {/* Privacy Notice */}
      <p className="text-xs text-muted-foreground text-center">
        This site is protected by reCAPTCHA and the Google{' '}
        <a 
          href="https://policies.google.com/privacy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          Privacy Policy
        </a>{' '}
        and{' '}
        <a 
          href="https://policies.google.com/terms" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:no-underline"
        >
          Terms of Service
        </a>{' '}
        apply.
      </p>
    </div>
  );
}