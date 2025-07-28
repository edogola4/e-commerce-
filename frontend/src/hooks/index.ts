// frontend/src/hooks/index.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { debounce } from '@/lib/utils';
import toast from 'react-hot-toast';

// Generic API hook
export function useApi<T>(
  apiCall: () => Promise<any>,
  dependencies: any[] = [],
  immediate: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      setData(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

// Authentication hook
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };
}

// Protected route hook
export function useProtectedRoute(redirectTo: string = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

// Local storage hook
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Search hook with debouncing
export function useSearch(initialQuery: string = '', delay: number = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedQuery = useDebounce(query, delay);

  const searchProducts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.products.searchProducts(searchQuery);
      setResults(response.data);
    } catch (err: any) {
      setError(handleApiError(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    searchProducts(debouncedQuery);
  }, [debouncedQuery, searchProducts]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([]),
  };
}

// Pagination hook
export function usePagination(
  fetchFunction: (page: number, limit: number) => Promise<any>,
  initialPage: number = 1,
  initialLimit: number = 12
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchData = useCallback(async (pageNum: number, limitNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchFunction(pageNum, limitNum);
      setData(response.data);
      setPagination(response.pagination || {
        total: response.data.length,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      });
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData(page, limit);
  }, [page, limit, fetchData]);

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
    }
  };

  const nextPage = () => {
    if (pagination.hasNext) {
      setPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (pagination.hasPrev) {
      setPage(prev => prev - 1);
    }
  };

  return {
    data,
    loading,
    error,
    page,
    limit,
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    refetch: () => fetchData(page, limit),
  };
}

// Form hook with validation
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: (values: T) => Record<string, string>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((formValues: T) => {
    if (validationSchema) {
      return validationSchema(formValues);
    }
    return {};
  }, [validationSchema]);

  const handleChange = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as string]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name: keyof T) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field on blur
    const fieldErrors = validate(values);
    if (fieldErrors[name as string]) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name as string] }));
    }
  };

  const handleSubmit = async (onSubmit: (values: T) => Promise<void> | void) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const touchedFields = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(touchedFields);

    // Validate all fields
    const formErrors = validate(values);
    setErrors(formErrors);

    // If no errors, submit the form
    if (Object.keys(formErrors).length === 0) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  const setFieldValue = (name: keyof T, value: any) => {
    handleChange(name, value);
  };

  const setFieldError = (name: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
}

// Shopping cart hook
export function useCart() {
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = async (productId: string, quantity: number = 1, variant?: any) => {
    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.cart.addToCart({ productId, quantity, variant });
      toast.success('Item added to cart!');
      return response;
    } catch (error: any) {
      toast.error(handleApiError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addToCart,
    isLoading,
  };
}

// Wishlist hook
export function useWishlist() {
  const [isLoading, setIsLoading] = useState(false);

  const toggleWishlist = async (productId: string, isInWishlist: boolean) => {
    const { isAuthenticated } = useAuthStore.getState();
    
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await api.wishlist.removeFromWishlist(productId);
        toast.success('Removed from wishlist');
      } else {
        await api.wishlist.addToWishlist(productId);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      toast.error(handleApiError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleWishlist,
    isLoading,
  };
}

// File upload hook
export function useFileUpload() {
  const [uploads, setUploads] = useState<Record<string, {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    url?: string;
    error?: string;
  }>>({});

  const uploadFile = useCallback(async (file: File, folder?: string) => {
    const fileId = `${file.name}_${Date.now()}`;
    
    setUploads(prev => ({
      ...prev,
      [fileId]: {
        file,
        progress: 0,
        status: 'uploading',
      },
    }));

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploads(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            progress: Math.min(prev[fileId].progress + 10, 90),
          },
        }));
      }, 200);

      const response = await api.upload.uploadImage(file, folder);
      
      clearInterval(progressInterval);
      
      setUploads(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          progress: 100,
          status: 'success',
          url: response.data.url,
        },
      }));

      return response.data;
    } catch (error: any) {
      setUploads(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          status: 'error',
          error: handleApiError(error),
        },
      }));
      throw error;
    }
  }, []);

  const removeUpload = (fileId: string) => {
    setUploads(prev => {
      const { [fileId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const clearUploads = () => {
    setUploads({});
  };

  return {
    uploads,
    uploadFile,
    removeUpload,
    clearUploads,
  };
}

// Intersection Observer hook
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Window size hook
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Copy to clipboard hook
export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      
      // Reset after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  return { isCopied, copyToClipboard };
}

// Toast hook with predefined messages
export function useToast() {
  const success = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const error = useCallback((message: string) => {
    toast.error(message);
  }, []);

  const info = useCallback((message: string) => {
    toast(message);
  }, []);

  const warning = useCallback((message: string) => {
    toast(message, {
      icon: '⚠️',
    });
  }, []);

  const loading = useCallback((message: string) => {
    return toast.loading(message);
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    toast.dismiss(toastId);
  }, []);

  return {
    success,
    error,
    info,
    warning,
    loading,
    dismiss,
  };
}