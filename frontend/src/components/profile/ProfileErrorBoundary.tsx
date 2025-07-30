// frontend/src/components/profile/ProfileErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ProfileErrorBoundary extends Component<Props, State> {
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    this.logError(error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
    };

    // Send to monitoring service (e.g., Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && window.console) {
      console.error('Profile Error Boundary:', errorData);
    }

    // Example: Send to external service
    try {
      // Replace with your actual error tracking service
      // Sentry.captureException(error, { extra: errorData });
      
      // Or send to your own endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      }).catch(fetchError => {
        console.warn('Failed to log error to server:', fetchError);
      });
    } catch (loggingError) {
      console.warn('Error logging failed:', loggingError);
    }
  };

  private getUserId = (): string | null => {
    try {
      // Get user ID from your auth context/localStorage/etc.
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const subject = encodeURIComponent('Profile Page Error Report');
    const body = encodeURIComponent(`
Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}

Steps to reproduce:
1. [Please describe what you were doing when the error occurred]

Browser: ${navigator.userAgent}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
    `);

    window.open(`mailto:support@yourcompany.com?subject=${subject}&body=${body}`);
  };

  private renderErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const { showDetails = false } = this.props;

    if (!showDetails || !error) return null;

    return (
      <details className="mt-4 p-4 bg-muted rounded-lg">
        <summary className="cursor-pointer font-medium text-sm mb-2">
          Technical Details (Click to expand)
        </summary>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <strong>Error:</strong>
            <pre className="mt-1 p-2 bg-red-50 rounded overflow-x-auto">
              {error.toString()}
            </pre>
          </div>
          {error.stack && (
            <div>
              <strong>Stack Trace:</strong>
              <pre className="mt-1 p-2 bg-red-50 rounded overflow-x-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          )}
          {errorInfo?.componentStack && (
            <div>
              <strong>Component Stack:</strong>
              <pre className="mt-1 p-2 bg-red-50 rounded overflow-x-auto max-h-40">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    const { hasError, retryCount, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < this.maxRetries;
      const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network');
      const isChunkError = error?.message?.includes('Loading chunk') || error?.message?.includes('ChunkLoadError');

      return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
              <CardDescription>
                {isChunkError 
                  ? "There was an issue loading part of the application. This usually happens after an update."
                  : isNetworkError
                  ? "We're having trouble connecting to our servers. Please check your internet connection."
                  : "An unexpected error occurred while loading your profile. Our team has been notified."
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error message for users */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again {retryCount > 0 && `(${retryCount}/${this.maxRetries})`}
                  </Button>
                )}
                
                {!canRetry && (
                  <Button onClick={this.handleReset} className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Reset
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
                
                <Button variant="outline" onClick={this.handleReportBug} className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Report Bug
                </Button>
              </div>

              {/* Helpful tips */}
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>You can try:</p>
                <ul className="list-disc list-inside space-y-1 text-left max-w-md mx-auto">
                  <li>Refreshing the page</li>
                  <li>Clearing your browser cache</li>
                  <li>Checking your internet connection</li>
                  <li>Trying again in a few minutes</li>
                </ul>
              </div>

              {/* Technical details */}
              {this.renderErrorDetails()}

              {/* Contact support */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  If the problem persists, please{' '}
                  <a 
                    href="mailto:support@yourcompany.com" 
                    className="text-primary hover:underline"
                  >
                    contact our support team
                  </a>
                  {' '}or{' '}
                  <a 
                    href="/help" 
                    className="text-primary hover:underline"
                  >
                    visit our help center
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// HOC wrapper for easier usage
export function withProfileErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ProfileErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ProfileErrorBoundary>
  );

  WrappedComponent.displayName = `withProfileErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for manually triggering error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    // This will trigger the nearest error boundary
    throw error;
  };
}

// Example usage in your profile page:
/*
// Wrap your profile page component
export default withProfileErrorBoundary(ProfilePage, {
  showDetails: process.env.NODE_ENV === 'development',
  onError: (error, errorInfo) => {
    // Custom error handling
    analytics.track('profile_page_error', {
      error: error.message,
      stack: error.stack,
    });
  },
});
*/