//src/lib/api.ts

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';
import Cookies from 'js-cookie';
import { ApiResponse, ApiEndpoints, ApiError } from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'ecommerce_token';
const REFRESH_TOKEN_KEY = 'ecommerce_refresh_token';

// API Endpoints
export const API_ENDPOINTS: ApiEndpoints = {
  // Auth endpoints
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  
  // User endpoints
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/change-password',
  ADDRESSES: '/user/addresses',
  
  // Product endpoints
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,
  PRODUCT_SEARCH: '/products/search',
  PRODUCT_CATEGORIES: '/categories',
  PRODUCT_REVIEWS: (id: string) => `/products/${id}/reviews`,
  
  // Cart endpoints
  CART: '/cart',
  ADD_TO_CART: '/cart/add',
  UPDATE_CART_ITEM: (id: string) => `/cart/${id}`,
  REMOVE_FROM_CART: (id: string) => `/cart/${id}`,
  
  // Order endpoints
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  CREATE_ORDER: '/orders',
  
  // Wishlist endpoints
  WISHLIST: '/wishlist',
  ADD_TO_WISHLIST: '/wishlist/add',
  REMOVE_FROM_WISHLIST: (id: string) => `/wishlist/${id}`,
  
  // Recommendation endpoints
  RECOMMENDATIONS: '/recommendations',
  TRENDING_PRODUCTS: '/recommendations/trending',
  SIMILAR_PRODUCTS: (id: string) => `/recommendations/similar/${id}`,
  
  // Payment endpoints
  MPESA_PAYMENT: '/payments/mpesa',
  PAYMENT_CALLBACK: '/payments/callback',
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get(TOKEN_KEY) || null;
  },

  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    Cookies.set(TOKEN_KEY, token, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  },

  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },

  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    Cookies.set(REFRESH_TOKEN_KEY, token, {
      expires: 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  },
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}${API_ENDPOINTS.REFRESH_TOKEN}`,
            { refreshToken }
          );

          const { token } = response.data.data;
          tokenManager.setToken(token);

          // Retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        tokenManager.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API request function
async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient({
      method,
      url: endpoint,
      data,
      ...config,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'Something went wrong',
        statusCode: error.response?.status || 500,
        errors: error.response?.data?.errors,
      };
      throw apiError;
    }
    throw new Error('Network error occurred');
  }
}

// Helper function to clean parameters
const cleanParams = (params: any): any => {
  if (!params) return {};
  
  const cleaned: any = {};
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') {
      // Handle arrays
      if (Array.isArray(value) && value.length > 0) {
        cleaned[key] = value;
      }
      // Handle other values
      else if (!Array.isArray(value)) {
        cleaned[key] = value;
      }
    }
  });
  
  return cleaned;
};

// API methods
export const api = {
  // Generic methods
  get: <T = any>(endpoint: string, config?: AxiosRequestConfig) => {
    // Clean params if they exist
    if (config?.params) {
      config.params = cleanParams(config.params);
    }
    return apiRequest<T>('GET', endpoint, undefined, config);
  },

  post: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>('POST', endpoint, data, config),

  put: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>('PUT', endpoint, data, config),

  patch: <T = any>(endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>('PATCH', endpoint, data, config),

  delete: <T = any>(endpoint: string, config?: AxiosRequestConfig) =>
    apiRequest<T>('DELETE', endpoint, undefined, config),

  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      api.post(API_ENDPOINTS.LOGIN, credentials),

    register: (userData: { name: string; email: string; password: string; phone?: string }) =>
      api.post(API_ENDPOINTS.REGISTER, userData),

    logout: () =>
      api.post(API_ENDPOINTS.LOGOUT),

    forgotPassword: (email: string) =>
      api.post(API_ENDPOINTS.FORGOT_PASSWORD, { email }),

    resetPassword: (token: string, password: string) =>
      api.post(API_ENDPOINTS.RESET_PASSWORD, { token, password }),

    verifyEmail: (token: string) =>
      api.post(API_ENDPOINTS.VERIFY_EMAIL, { token }),

    refreshToken: (refreshToken: string) =>
      api.post(API_ENDPOINTS.REFRESH_TOKEN, { refreshToken }),
  },

  // User management
  user: {
    getProfile: () =>
      api.get(API_ENDPOINTS.PROFILE),

    updateProfile: (data: any) =>
      api.put(API_ENDPOINTS.UPDATE_PROFILE, data),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      api.put(API_ENDPOINTS.CHANGE_PASSWORD, data),

    getAddresses: () =>
      api.get(API_ENDPOINTS.ADDRESSES),

    addAddress: (address: any) =>
      api.post(API_ENDPOINTS.ADDRESSES, address),

    updateAddress: (id: string, address: any) =>
      api.put(`${API_ENDPOINTS.ADDRESSES}/${id}`, address),

    deleteAddress: (id: string) =>
      api.delete(`${API_ENDPOINTS.ADDRESSES}/${id}`),
  },

  // Products - ENHANCED WITH BETTER FILTERING
  products: {
    getProducts: (params?: any) => {
      const cleanedParams = cleanParams(params);
      return api.get(API_ENDPOINTS.PRODUCTS, { params: cleanedParams });
    },

    // Specific method for featured products
    getFeaturedProducts: (limit: number = 8) =>
      api.get(API_ENDPOINTS.PRODUCTS, { 
        params: { featured: true, limit, isActive: true } 
      }),

    // Specific method for sale products
    getSaleProducts: (limit: number = 6) =>
      api.get(API_ENDPOINTS.PRODUCTS, { 
        params: { 
          onSale: true, 
          limit,
          isActive: true,
          sort: '-discount' // Sort by discount descending
        } 
      }),

    // Enhanced method for products with proper filtering
    getProductsWithFilters: (filters: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      featured?: boolean;
      onSale?: boolean;
      search?: string;
      tags?: string[];
      page?: number;
      limit?: number;
      sort?: string;
    } = {}) => {
      const cleanedFilters = cleanParams(filters);
      return api.get(API_ENDPOINTS.PRODUCTS, { params: cleanedFilters });
    },

    getProduct: (id: string) =>
      api.get(API_ENDPOINTS.PRODUCT_BY_ID(id)),

    searchProducts: (query: string, filters?: any) =>
      api.get(API_ENDPOINTS.PRODUCT_SEARCH, { 
        params: cleanParams({ q: query, ...filters })
      }),

    getCategories: () =>
      api.get(API_ENDPOINTS.PRODUCT_CATEGORIES),

    getProductReviews: (id: string, params?: any) =>
      api.get(API_ENDPOINTS.PRODUCT_REVIEWS(id), { params: cleanParams(params) }),

    addReview: (productId: string, review: any) =>
      api.post(API_ENDPOINTS.PRODUCT_REVIEWS(productId), review),
  },

  // Cart management
  cart: {
    getCart: () =>
      api.get(API_ENDPOINTS.CART),

    addToCart: (data: { productId: string; quantity: number; variant?: any }) =>
      api.post(API_ENDPOINTS.ADD_TO_CART, data),

    updateCartItem: (id: string, quantity: number) =>
      api.put(API_ENDPOINTS.UPDATE_CART_ITEM(id), { quantity }),

    removeFromCart: (id: string) =>
      api.delete(API_ENDPOINTS.REMOVE_FROM_CART(id)),

    clearCart: () =>
      api.delete(API_ENDPOINTS.CART),
  },

  // Orders
  orders: {
    getOrders: (params?: any) =>
      api.get(API_ENDPOINTS.ORDERS, { params: cleanParams(params) }),

    getOrder: (id: string) =>
      api.get(API_ENDPOINTS.ORDER_BY_ID(id)),

    createOrder: (orderData: any) =>
      api.post(API_ENDPOINTS.CREATE_ORDER, orderData),

    updateOrderStatus: (id: string, status: string) =>
      api.patch(API_ENDPOINTS.ORDER_BY_ID(id), { status }),

    cancelOrder: (id: string, reason?: string) =>
      api.patch(API_ENDPOINTS.ORDER_BY_ID(id), { 
        status: 'cancelled', 
        cancellationReason: reason 
      }),
  },

  // Wishlist
  wishlist: {
    getWishlist: () =>
      api.get(API_ENDPOINTS.WISHLIST),

    addToWishlist: (productId: string) =>
      api.post(API_ENDPOINTS.ADD_TO_WISHLIST, { productId }),

    removeFromWishlist: (id: string) =>
      api.delete(API_ENDPOINTS.REMOVE_FROM_WISHLIST(id)),

    clearWishlist: () =>
      api.delete(API_ENDPOINTS.WISHLIST),
  },

  // Recommendations - ENHANCED
  recommendations: {
    getRecommendations: (userId?: string) =>
      api.get(API_ENDPOINTS.RECOMMENDATIONS, { 
        params: userId ? { userId } : {} 
      }),

    getTrendingProducts: (limit: number = 10) =>
      api.get(API_ENDPOINTS.TRENDING_PRODUCTS, { params: { limit } }),

    getSimilarProducts: (productId: string, limit: number = 4) =>
      api.get(API_ENDPOINTS.SIMILAR_PRODUCTS(productId), { params: { limit } }),

    getPersonalizedRecommendations: (type?: string, limit: number = 10) =>
      api.get(API_ENDPOINTS.RECOMMENDATIONS, { 
        params: cleanParams({ type, limit })
      }),
  },

  // Payments
  payments: {
    initiateMpesaPayment: (data: {
      phoneNumber: string;
      amount: number;
      orderId: string;
    }) =>
      api.post(API_ENDPOINTS.MPESA_PAYMENT, data),

    confirmPayment: (data: {
      checkoutRequestId: string;
      orderId: string;
    }) =>
      api.post(`${API_ENDPOINTS.MPESA_PAYMENT}/confirm`, data),

    getPaymentStatus: (orderId: string) =>
      api.get(`${API_ENDPOINTS.MPESA_PAYMENT}/status/${orderId}`),
  },

  // File upload
  upload: {
    uploadImage: (file: File, folder?: string) => {
      const formData = new FormData();
      formData.append('image', file);
      if (folder) formData.append('folder', folder);

      return api.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    uploadMultipleImages: (files: File[], folder?: string) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });
      if (folder) formData.append('folder', folder);

      return api.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  },

  // Analytics
  analytics: {
    trackEvent: (eventData: {
      event: string;
      category: string;
      label?: string;
      value?: number;
      properties?: Record<string, any>;
    }) =>
      api.post('/analytics/event', eventData),

    trackPageView: (pageData: {
      page: string;
      title: string;
      referrer?: string;
    }) =>
      api.post('/analytics/pageview', pageData),

    trackPurchase: (purchaseData: {
      orderId: string;
      amount: number;
      items: any[];
    }) =>
      api.post('/analytics/purchase', purchaseData),
  },

  // Newsletter
  newsletter: {
    subscribe: (email: string, preferences?: any) =>
      api.post('/newsletter/subscribe', { email, preferences }),

    unsubscribe: (email: string, token?: string) =>
      api.post('/newsletter/unsubscribe', { email, token }),

    updatePreferences: (email: string, preferences: any) =>
      api.put('/newsletter/preferences', { email, preferences }),
  },

  // Contact
  contact: {
    sendMessage: (data: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }) =>
      api.post('/contact', data),

    getFAQs: () =>
      api.get('/contact/faqs'),

    getStoreInfo: () =>
      api.get('/contact/store-info'),
  },

  // Search and filters
  search: {
    getSearchSuggestions: (query: string) =>
      api.get('/search/suggestions', { params: { q: query } }),

    getPopularSearches: () =>
      api.get('/search/popular'),

    saveSearch: (query: string) =>
      api.post('/search/save', { query }),

    getSearchHistory: () =>
      api.get('/search/history'),

    clearSearchHistory: () =>
      api.delete('/search/history'),
  },
};

// CONVENIENCE EXPORTS FOR EASIER USE
export const getProducts = api.products.getProducts;
export const getFeaturedProducts = api.products.getFeaturedProducts;
export const getSaleProducts = api.products.getSaleProducts;
export const getProduct = api.products.getProduct;
export const getCategories = api.products.getCategories;
export const getTrendingProducts = api.recommendations.getTrendingProducts;
export const getSimilarProducts = api.recommendations.getSimilarProducts;

// Error handler utility
export const handleApiError = (error: any): string => {
  if (error?.errors) {
    // Return first validation error
    const firstError = Object.values(error.errors)[0];
    if (Array.isArray(firstError)) {
      return firstError[0];
    }
    return String(firstError);
  }
  
  return error?.message || 'Something went wrong';
};

// Request/Response logging for development
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
      return response;
    },
    (error) => {
      console.error(`❌ API Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
}

export default api;