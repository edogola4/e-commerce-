// src/types/index.ts
// src/types/index.ts
export interface ApiResponse<T = any> {
  user: any;
  token: any;
  success: boolean;
  message: string;
  data?: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  pages: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
  tags?: string[];
}

// User types
export interface User {
  lastName: string;
  firstName: string;
  orders: any;
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'seller' | 'admin';
  isEmailVerified: boolean;
  isActive: boolean;
  addresses: Address[];
  preferences: UserPreferences;
  cart: CartItem[];
  wishlist: string[];
  orderHistory: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands: string[];
  size?: string;
  color?: string;
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Product types - ENHANCED FOR COMPATIBILITY
export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  comparePrice?: number; // Alternative to originalPrice
  discount?: number;
  images: string[] | ProductImage[]; // Support both formats
  category: string | Category; // Support both ID and object
  subcategory?: Category;
  brand: string;
  sku: string;
  slug: string;
  tags: string[];
  variants: ProductVariant[];
  specifications: Record<string, string>;
  features: string[];
  dimensions?: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  shipping: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    freeShipping: boolean;
    shippingCost: number;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  stock: number;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  status: 'active' | 'inactive' | 'discontinued';
  isActive?: boolean; // Alternative to status check
  isFeatured: boolean;
  isOnSale?: boolean; // Alternative to checking discount
  onSale?: boolean; // Backend might use this
  rating?: number | ProductRating; // Support both formats
  reviewCount?: number; // Count of reviews
  reviews: Review[];
  viewCount: number;
  purchaseCount: number;
  wishlistCount: number;
  seller: {
    _id: string;
    name: string;
    rating: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  _id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  color?: string;
}

export interface ProductVariant {
  _id?: string;
  type: 'size' | 'color' | 'material' | 'style';
  name: string;
  value: string;
  price?: number;
  stock: number;
  sku: string;
  images?: string[];
}

export interface ProductRating {
  average: number;
  count: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Category types - ENHANCED
export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string;
  children: Category[];
  level: number;
  productCount: number;
  isActive: boolean;
  sort: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

// Cart types
export interface CartItem {
  _id?: string;
  product: string | Product;
  variant?: {
    type: string;
    value: string;
  };
  quantity: number;
  price: number;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  itemCount: number;
}

// Order types
export interface Order {
  _id: string;
  orderNumber: string;
  user: string | User;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  pricing: OrderPricing;
  tracking?: {
    trackingNumber: string;
    carrier: string;
    url: string;
  };
  estimatedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    type: string;
    value: string;
  };
  total: number;
}

export interface OrderPricing {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
}

export interface PaymentMethod {
  type: 'card' | 'mpesa' | 'bank_transfer' | 'cod';
  details?: Record<string, any>;
}

// Review types
export interface Review {
  _id: string;
  product: string | Product;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  sellerReply?: {
    comment: string;
    date: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Recommendation types
export interface Recommendation {
  type: 'trending' | 'similar' | 'frequently_bought_together' | 'recommended_for_you' | 'recently_viewed';
  products: Product[];
  title: string;
  subtitle?: string;
}

// Search types
export interface SearchFilters {
  categories: string[];
  brands: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  inStock: boolean;
  onSale: boolean;
  freeShipping: boolean;
}

export interface SearchResult {
  products: Product[];
  filters: {
    categories: FilterOption[];
    brands: FilterOption[];
    priceRange: {
      min: number;
      max: number;
    };
  };
  total: number;
  query: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

// Wishlist types
export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: string;
}

// Notification types
export interface Notification {
  _id: string;
  type: 'order' | 'product' | 'promotion' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// Form types
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterSubscription {
  email: string;
}

export interface ProductReviewForm {
  rating: number;
  title: string;
  comment: string;
  images?: File[];
}

// Error types
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

// API Error types
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Toast types
export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Layout types
export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Modal types
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Table types
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T) => void;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  category: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

// SEO types
export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

// Route types
export interface RouteParams {
  [key: string]: string | string[] | undefined;
}

// Store types (for Zustand)
export interface StoreState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Cart state
  cart: Cart;
  
  // UI state
  theme: Theme;
  sidebarOpen: boolean;
  searchModalOpen: boolean;
  
  // Loading states
  loading: {
    auth: boolean;
    cart: boolean;
    products: boolean;
    orders: boolean;
  };
}

export interface StoreActions {
  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  
  // Cart actions
  addToCart: (productId: string, quantity: number, variant?: any) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
  
  // UI actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  toggleSearchModal: () => void;
  
  // Loading actions
  setLoading: (key: keyof StoreState['loading'], value: boolean) => void;
}

// Hook return types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FormErrors;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (name: keyof T, value: any) => void;
  handleBlur: (name: keyof T) => void;
  handleSubmit: (onSubmit: (values: T) => Promise<void> | void) => Promise<void>;
  reset: () => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
}

// Payment types
export interface MPesaPayment {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  message: string;
  checkoutRequestId?: string;
}

// File upload types
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

// Social sharing types
export interface SocialShareData {
  url: string;
  title: string;
  description?: string;
  image?: string;
  hashtags?: string[];
}

// Newsletter types
export interface NewsletterData {
  email: string;
  preferences?: {
    deals: boolean;
    newProducts: boolean;
    newsletter: boolean;
  };
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Pick<Required<T>, K>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// API endpoint types
export interface ApiEndpoints {
  // Auth endpoints
  LOGIN: string;
  REGISTER: string;
  LOGOUT: string;
  REFRESH_TOKEN: string;
  FORGOT_PASSWORD: string;
  RESET_PASSWORD: string;
  VERIFY_EMAIL: string;
  
  // User endpoints
  PROFILE: string;
  UPDATE_PROFILE: string;
  CHANGE_PASSWORD: string;
  ADDRESSES: string;
  
  // Product endpoints
  PRODUCTS: string;
  PRODUCT_BY_ID: (id: string) => string;
  PRODUCT_SEARCH: string;
  PRODUCT_CATEGORIES: string;
  PRODUCT_REVIEWS: (id: string) => string;
  
  // Cart endpoints
  CART: string;
  ADD_TO_CART: string;
  UPDATE_CART_ITEM: (id: string) => string;
  REMOVE_FROM_CART: (id: string) => string;
  
  // Order endpoints
  ORDERS: string;
  ORDER_BY_ID: (id: string) => string;
  CREATE_ORDER: string;
  
  // Wishlist endpoints
  WISHLIST: string;
  ADD_TO_WISHLIST: string;
  REMOVE_FROM_WISHLIST: (id: string) => string;
  
  // Recommendation endpoints
  RECOMMENDATIONS: string;
  TRENDING_PRODUCTS: string;
  SIMILAR_PRODUCTS: (id: string) => string;
  
  // Payment endpoints
  MPESA_PAYMENT: string;
  PAYMENT_CALLBACK: string;
}

// PRODUCT FILTER INTERFACES - For better API compatibility
export interface ProductFilters {
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
  sort?: 'price' | '-price' | 'name' | '-name' | 'createdAt' | '-createdAt' | 'rating' | '-rating' | 'discount' | '-discount';
  isActive?: boolean;
}

// API RESPONSE HELPERS - For handling different response formats
export type ProductsResponse = ApiResponse<Product[]>;
export type CategoriesResponse = ApiResponse<Category[]>;
export type ProductResponse = ApiResponse<Product>;
export type CategoryResponse = ApiResponse<Category>;

// UTILITY TYPES FOR COMPONENTS
export interface ComponentLoadingState {
  isLoading: boolean;
  error: string | null;
  data: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// Constants
export const USER_ROLES = {
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
} as const;