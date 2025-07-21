// src/config/app.config.ts
export interface AppConfig {
    env: 'development' | 'staging' | 'production';
    apiUrl: string;
    apiTimeout: number;
    apiRetries: number;
    version: string;
    features: {
      recommendations: boolean;
      reviews: boolean;
      wishlist: boolean;
      mpesa: boolean;
      analytics: boolean;
      pwa: boolean;
      darkMode: boolean;
    };
    security: {
      encryptLocalStorage: boolean;
      sessionTimeout: number;
      maxLoginAttempts: number;
      passwordMinLength: number;
      enableCSRF: boolean;
    };
    performance: {
      enablePrefetch: boolean;
      enableLazyLoading: boolean;
      imageCDN: string;
      cacheTimeout: number;
    };
    seo: {
      defaultTitle: string;
      titleTemplate: string;
      defaultDescription: string;
      defaultImage: string;
      siteUrl: string;
    };
    analytics: {
      googleAnalyticsId?: string;
      mixpanelToken?: string;
      sentryDsn?: string;
      enabledProviders: string[];
    };
    i18n: {
      defaultLocale: string;
      supportedLocales: string[];
      fallbackLocale: string;
    };
  }
  
  const getEnvVar = (key: string, defaultValue?: string): string => {
    const value = process.env[key];
    if (!value && !defaultValue) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value || defaultValue || '';
  };
  
  export const appConfig: AppConfig = {
    env: (process.env.REACT_APP_ENV as AppConfig['env']) || 'development',
    apiUrl: getEnvVar('REACT_APP_API_URL', 'http://localhost:5000/api'),
    apiTimeout: parseInt(getEnvVar('REACT_APP_API_TIMEOUT', '30000')),
    apiRetries: parseInt(getEnvVar('REACT_APP_API_RETRIES', '3')),
    version: process.env.REACT_APP_VERSION || '1.0.0',
    features: {
      recommendations: process.env.REACT_APP_FEATURE_RECOMMENDATIONS === 'true',
      reviews: process.env.REACT_APP_FEATURE_REVIEWS !== 'false',
      wishlist: process.env.REACT_APP_FEATURE_WISHLIST !== 'false',
      mpesa: process.env.REACT_APP_FEATURE_MPESA === 'true',
      analytics: process.env.REACT_APP_FEATURE_ANALYTICS !== 'false',
      pwa: process.env.REACT_APP_FEATURE_PWA === 'true',
      darkMode: process.env.REACT_APP_FEATURE_DARK_MODE === 'true',
    },
    security: {
      encryptLocalStorage: process.env.REACT_APP_ENCRYPT_LOCAL_STORAGE === 'true',
      sessionTimeout: parseInt(getEnvVar('REACT_APP_SESSION_TIMEOUT', '3600000')),
      maxLoginAttempts: parseInt(getEnvVar('REACT_APP_MAX_LOGIN_ATTEMPTS', '5')),
      passwordMinLength: parseInt(getEnvVar('REACT_APP_PASSWORD_MIN_LENGTH', '8')),
      enableCSRF: process.env.REACT_APP_ENABLE_CSRF === 'true',
    },
    performance: {
      enablePrefetch: process.env.REACT_APP_ENABLE_PREFETCH !== 'false',
      enableLazyLoading: process.env.REACT_APP_ENABLE_LAZY_LOADING !== 'false',
      imageCDN: getEnvVar('REACT_APP_IMAGE_CDN', 'https://res.cloudinary.com'),
      cacheTimeout: parseInt(getEnvVar('REACT_APP_CACHE_TIMEOUT', '300000')),
    },
    seo: {
      defaultTitle: 'E-Commerce Store',
      titleTemplate: '%s | E-Commerce Store',
      defaultDescription: 'Shop the best products online with our e-commerce store',
      defaultImage: '/og-image.jpg',
      siteUrl: getEnvVar('REACT_APP_SITE_URL', 'https://example.com'),
    },
    analytics: {
      googleAnalyticsId: process.env.REACT_APP_GA_ID,
      mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN,
      sentryDsn: process.env.REACT_APP_SENTRY_DSN,
      enabledProviders: process.env.REACT_APP_ANALYTICS_PROVIDERS?.split(',') || [],
    },
    i18n: {
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'zh'],
      fallbackLocale: 'en',
    },
  };
  
  export const apiConfig = {
    baseURL: appConfig.apiUrl,
    timeout: appConfig.apiTimeout,
    retries: appConfig.apiRetries,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': appConfig.version,
    },
    endpoints: {
      auth: {
        login: '/auth/login',
        register: '/auth/register',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        profile: '/auth/profile',
        forgotPassword: '/auth/forgot-password',
        resetPassword: '/auth/reset-password',
        verifyEmail: '/auth/verify-email',
      },
      products: {
        list: '/products',
        detail: '/products/:id',
        search: '/products/search',
        trending: '/products/trending',
        recommendations: '/products/recommendations',
        reviews: '/products/:id/reviews',
      },
      cart: {
        get: '/cart',
        add: '/cart/add',
        update: '/cart/update',
        remove: '/cart/remove',
        clear: '/cart/clear',
      },
      orders: {
        create: '/orders',
        list: '/orders',
        detail: '/orders/:id',
        cancel: '/orders/:id/cancel',
        track: '/orders/:id/track',
      },
      payment: {
        initiate: '/payment/initiate',
        confirm: '/payment/confirm',
        status: '/payment/status/:id',
      },
      user: {
        addresses: '/user/addresses',
        wishlist: '/user/wishlist',
        preferences: '/user/preferences',
        notifications: '/user/notifications',
      },
    },
  };
  
  export const routesConfig = {
    public: {
      home: '/',
      products: '/products',
      productDetail: '/products/:slug',
      categories: '/categories',
      categoryProducts: '/categories/:slug',
      search: '/search',
      about: '/about',
      contact: '/contact',
      terms: '/terms',
      privacy: '/privacy',
    },
    auth: {
      login: '/login',
      register: '/register',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password/:token',
      verifyEmail: '/verify-email/:token',
    },
    protected: {
      dashboard: '/dashboard',
      profile: '/profile',
      orders: '/orders',
      orderDetail: '/orders/:id',
      addresses: '/addresses',
      wishlist: '/wishlist',
      cart: '/cart',
      checkout: '/checkout',
      paymentSuccess: '/payment/success',
      paymentFailed: '/payment/failed',
    },
    admin: {
      dashboard: '/admin',
      products: '/admin/products',
      orders: '/admin/orders',
      users: '/admin/users',
      analytics: '/admin/analytics',
      settings: '/admin/settings',
    },
  };
  
  // Validate config in development
  if (appConfig.env === 'development') {
    console.log('App Config:', appConfig);
  }