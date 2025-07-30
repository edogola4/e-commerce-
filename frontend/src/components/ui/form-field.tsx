// frontend/src/components/ui/form-field.tsx
'use client';

import { ReactNode, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
  description?: string;
  className?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      id,
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      onBlur,
      error,
      disabled = false,
      required = false,
      autoComplete,
      icon: Icon,
      rightElement,
      description,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = Boolean(error);

    return (
      <div className={cn('space-y-2', className)}>
        <Label 
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            hasError && 'text-destructive',
            disabled && 'text-muted-foreground'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          
          <Input
            ref={ref}
            id={id}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            autoComplete={autoComplete}
            className={cn(
              Icon && 'pl-10',
              rightElement && 'pr-10',
              hasError && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${id}-error` : description ? `${id}-description` : undefined
            }
            {...props}
          />
          
          {rightElement && (
            <div className="absolute right-0 top-0 h-full flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        
        {description && !error && (
          <p 
            id={`${id}-description`}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        
        {error && (
          <p 
            id={`${id}-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// frontend/src/components/ui/loading-spinner.tsx
export function LoadingSpinner({ 
  size = 'md', 
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// frontend/src/hooks/useRateLimit.ts
import { useState, useCallback, useEffect, useRef } from 'react';

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  storageKey?: string;
}

interface RateLimitState {
  attempts: number;
  isBlocked: boolean;
  nextAttemptTime?: Date;
  attemptsLeft: number;
}

interface RateLimitReturn extends RateLimitState {
  recordAttempt: () => void;
  reset: () => void;
  canAttempt: boolean;
}

export function useRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitReturn {
  const {
    maxAttempts,
    windowMs,
    blockDurationMs,
    storageKey = 'rate_limit'
  } = options;

  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    isBlocked: false,
    attemptsLeft: maxAttempts
  });

  const timeoutRef = useRef<NodeJS.Timeout>();

  const getStorageKey = useCallback(() => {
    return `${storageKey}_${identifier}`;
  }, [storageKey, identifier]);

  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(getStorageKey());
      if (stored) {
        const data = JSON.parse(stored);
        return {
          ...data,
          firstAttempt: new Date(data.firstAttempt),
          blockedUntil: data.blockedUntil ? new Date(data.blockedUntil) : undefined
        };
      }
    } catch (error) {
      console.warn('Error loading rate limit data:', error);
    }
    return null;
  }, [getStorageKey]);

  const saveToStorage = useCallback((data: any) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving rate limit data:', error);
    }
  }, [getStorageKey]);

  const checkRateLimit = useCallback(() => {
    const now = new Date();
    const stored = loadFromStorage();

    if (!stored) {
      setState({
        attempts: 0,
        isBlocked: false,
        attemptsLeft: maxAttempts
      });
      return;
    }

    const { attempts, firstAttempt, blockedUntil } = stored;

    // Check if block period has expired
    if (blockedUntil && now > blockedUntil) {
      localStorage.removeItem(getStorageKey());
      setState({
        attempts: 0,
        isBlocked: false,
        attemptsLeft: maxAttempts
      });
      return;
    }

    // If currently blocked
    if (blockedUntil && now <= blockedUntil) {
      setState({
        attempts: maxAttempts,
        isBlocked: true,
        nextAttemptTime: blockedUntil,
        attemptsLeft: 0
      });

      // Set timeout to update state when block expires
      const timeToUnblock = blockedUntil.getTime() - now.getTime();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(checkRateLimit, timeToUnblock);
      return;
    }

    // Check if window has expired
    const windowExpired = now.getTime() - firstAttempt.getTime() > windowMs;
    if (windowExpired) {
      localStorage.removeItem(getStorageKey());
      setState({
        attempts: 0,
        isBlocked: false,
        attemptsLeft: maxAttempts
      });
      return;
    }

    // Update state with current attempts
    setState({
      attempts,
      isBlocked: false,
      attemptsLeft: Math.max(0, maxAttempts - attempts)
    });

  }, [loadFromStorage, maxAttempts, windowMs, getStorageKey]);

  const recordAttempt = useCallback(() => {
    const now = new Date();
    const stored = loadFromStorage();

    let newAttempts = 1;
    let firstAttempt = now;

    if (stored && now.getTime() - stored.firstAttempt.getTime() <= windowMs) {
      newAttempts = stored.attempts + 1;
      firstAttempt = stored.firstAttempt;
    }

    const shouldBlock = newAttempts >= maxAttempts;
    const blockedUntil = shouldBlock ? new Date(now.getTime() + blockDurationMs) : undefined;

    const dataToStore = {
      attempts: newAttempts,
      firstAttempt: firstAttempt.toISOString(),
      blockedUntil: blockedUntil?.toISOString()
    };

    saveToStorage(dataToStore);

    setState({
      attempts: newAttempts,
      isBlocked: shouldBlock,
      nextAttemptTime: blockedUntil,
      attemptsLeft: Math.max(0, maxAttempts - newAttempts)
    });

    if (shouldBlock) {
      // Set timeout to update state when block expires
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(checkRateLimit, blockDurationMs);
    }
  }, [loadFromStorage, saveToStorage, maxAttempts, windowMs, blockDurationMs, checkRateLimit]);

  const reset = useCallback(() => {
    localStorage.removeItem(getStorageKey());
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setState({
      attempts: 0,
      isBlocked: false,
      attemptsLeft: maxAttempts
    });
  }, [getStorageKey, maxAttempts]);

  useEffect(() => {
    checkRateLimit();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkRateLimit]);

  return {
    ...state,
    recordAttempt,
    reset,
    canAttempt: !state.isBlocked && state.attemptsLeft > 0
  };
}

// frontend/src/hooks/useSecurityMonitor.ts
import { useCallback } from 'react';
import { SecurityEvent, trackSecurityEvent } from '@/types/auth';

interface UseSecurityMonitorReturn {
  recordEvent: (event: SecurityEvent) => void;
  recordSuspiciousActivity: (activity: string, metadata?: Record<string, any>) => void;
  recordLoginAttempt: (email: string, success: boolean, metadata?: Record<string, any>) => void;
}

export function useSecurityMonitor(): UseSecurityMonitorReturn {
  const recordEvent = useCallback((event: SecurityEvent) => {
    trackSecurityEvent(event);
  }, []);

  const recordSuspiciousActivity = useCallback((
    activity: string, 
    metadata?: Record<string, any>
  ) => {
    recordEvent({
      type: 'suspicious_activity',
      severity: 'high',
      metadata: {
        activity,
        ...metadata
      }
    });
  }, [recordEvent]);

  const recordLoginAttempt = useCallback((
    email: string, 
    success: boolean, 
    metadata?: Record<string, any>
  ) => {
    recordEvent({
      type: success ? 'login_success' : 'login_failure',
      severity: success ? 'low' : 'medium',
      metadata: {
        email,
        success,
        ...metadata
      }
    });
  }, [recordEvent]);

  return {
    recordEvent,
    recordSuspiciousActivity,
    recordLoginAttempt
  };
}