import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  User, 
  Cart, 
  CartItem, 
  Theme, 
  LoginCredentials, 
  RegisterData,
  Product,
  WishlistItem,
  Order,
  Notification
} from '@/types';
import { api, tokenManager, handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  immer((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await api.auth.login(credentials);
        const { user, token } = response.data;

        tokenManager.setToken(token);

        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
          state.isLoading = false;
        });

        toast.success('Login successful!');
      } catch (error: any) {
        const errorMessage = handleApiError(error);
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        toast.error(errorMessage);
        throw error;
      }
    },

    register: async (data) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await api.auth.register(data);
        const { user, token } = response.data;

        tokenManager.setToken(token);

        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
          state.isLoading = false;
        });

        toast.success('Registration successful!');
      } catch (error: any) {
        const errorMessage = handleApiError(error);
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        toast.error(errorMessage);
        throw error;
      }
    },

    logout: () => {
      tokenManager.removeToken();
      set((state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });
      
      // Clear other stores
      useCartStore.getState().clearCart();
      useWishlistStore.getState().clearWishlist();
      
      toast.success('Logged out successfully');
    },

    updateProfile: async (data) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await api.user.updateProfile(data);
        const updatedUser = response.data;

        set((state) => {
          state.user = updatedUser;
          state.isLoading = false;
        });

        toast.success('Profile updated successfully!');
      } catch (error: any) {
        const errorMessage = handleApiError(error);
        set((state) => {
          state.error = errorMessage;
          state.isLoading = false;
        });
        toast.error(errorMessage);
        throw error;
      }
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    checkAuth: async () => {
      const token = tokenManager.getToken();
      if (!token) return;

      try {
        const response = await api.user.getProfile();
        const user = response.data;

        set((state) => {
          state.user = user;
          state.isAuthenticated = true;
        });
      } catch (error) {
        tokenManager.removeToken();
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
        });
      }
    },
  }))
);

// Cart Store
interface CartState {
  cart: Cart;
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, variant?: any) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
  updateLocalCart: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    immer((set, get) => ({
      cart: {
        items: [],
        total: 0,
        subtotal: 0,
        shipping: 0,
        tax: 0,
        discount: 0,
        itemCount: 0,
      },
      isLoading: false,
      error: null,

      fetchCart: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await api.cart.getCart();
          const cart = response.data;

          set((state) => {
            state.cart = cart;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = handleApiError(error);
            state.isLoading = false;
          });
        }
      },

      addToCart: async (productId, quantity, variant) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await api.cart.addToCart({
            productId,
            quantity,
            variant,
          });

          await get().fetchCart();
          toast.success('Item added to cart!');
        } catch (error: any) {
          const errorMessage = handleApiError(error);
          set((state) => {
            state.error = errorMessage;
            state.isLoading = false;
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      updateCartItem: async (itemId, quantity) => {
        if (quantity <= 0) {
          return get().removeFromCart(itemId);
        }

        try {
          await api.cart.updateCartItem(itemId, quantity);
          await get().fetchCart();
        } catch (error: any) {
          toast.error(handleApiError(error));
          throw error;
        }
      },

      removeFromCart: async (itemId) => {
        try {
          await api.cart.removeFromCart(itemId);
          await get().fetchCart();
          toast.success('Item removed from cart');
        } catch (error: any) {
          toast.error(handleApiError(error));
          throw error;
        }
      },

      clearCart: () => {
        set((state) => {
          state.cart = {
            items: [],
            total: 0,
            subtotal: 0,
            shipping: 0,
            tax: 0,
            discount: 0,
            itemCount: 0,
          };
        });
      },

      updateLocalCart: (items) => {
        set((state) => {
          const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const shipping = subtotal > 1000 ? 0 : 100; // Free shipping over 1000 KES
          const tax = subtotal * 0.16; // 16% VAT
          const total = subtotal + shipping + tax;

          state.cart = {
            items,
            subtotal,
            shipping,
            tax,
            discount: 0,
            total,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          };
        });
      },
    })),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);

// Wishlist Store
interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
}

interface WishlistActions {
  fetchWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => void;
  isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState & WishlistActions>()(
  persist(
    immer((set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchWishlist: async () => {
        if (!useAuthStore.getState().isAuthenticated) return;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await api.wishlist.getWishlist();
          const items = response.data;

          set((state) => {
            state.items = items;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = handleApiError(error);
            state.isLoading = false;
          });
        }
      },

      addToWishlist: async (productId) => {
        try {
          await api.wishlist.addToWishlist(productId);
          await get().fetchWishlist();
          toast.success('Added to wishlist!');
        } catch (error: any) {
          toast.error(handleApiError(error));
          throw error;
        }
      },

      removeFromWishlist: async (productId) => {
        try {
          await api.wishlist.removeFromWishlist(productId);
          await get().fetchWishlist();
          toast.success('Removed from wishlist');
        } catch (error: any) {
          toast.error(handleApiError(error));
          throw error;
        }
      },

      clearWishlist: () => {
        set((state) => {
          state.items = [];
        });
      },

      isInWishlist: (productId) => {
        return get().items.some(item => 
          typeof item.product === 'string' 
            ? item.product === productId 
            : item.product._id === productId
        );
      },
    })),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

// UI Store
interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  searchModalOpen: boolean;
  cartModalOpen: boolean;
  wishlistModalOpen: boolean;
  mobileMenuOpen: boolean;
  loading: {
    global: boolean;
    products: boolean;
    orders: boolean;
  };
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSearchModal: () => void;
  toggleCartModal: () => void;
  toggleWishlistModal: () => void;
  toggleMobileMenu: () => void;
  setLoading: (key: keyof UIState['loading'], value: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    immer((set) => ({
      theme: 'system',
      sidebarOpen: false,
      searchModalOpen: false,
      cartModalOpen: false,
      wishlistModalOpen: false,
      mobileMenuOpen: false,
      loading: {
        global: false,
        products: false,
        orders: false,
      },

      setTheme: (theme) => {
        set((state) => {
          state.theme = theme;
        });
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },

      setSidebarOpen: (open) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },

      toggleSearchModal: () => {
        set((state) => {
          state.searchModalOpen = !state.searchModalOpen;
        });
      },

      toggleCartModal: () => {
        set((state) => {
          state.cartModalOpen = !state.cartModalOpen;
        });
      },

      toggleWishlistModal: () => {
        set((state) => {
          state.wishlistModalOpen = !state.wishlistModalOpen;
        });
      },

      toggleMobileMenu: () => {
        set((state) => {
          state.mobileMenuOpen = !state.mobileMenuOpen;
        });
      },

      setLoading: (key, value) => {
        set((state) => {
          state.loading[key] = value;
        });
      },
    })),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Products Store
interface ProductsState {
  products: Product[];
  featuredProducts: Product[];
  categories: any[];
  currentProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

interface ProductsActions {
  fetchProducts: (params?: any) => Promise<void>;
  fetchFeaturedProducts: () => Promise<void>;
  fetchProduct: (id: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  searchProducts: (query: string, filters?: any) => Promise<void>;
  clearProducts: () => void;
}

export const useProductsStore = create<ProductsState & ProductsActions>()(
  immer((set, get) => ({
    products: [],
    featuredProducts: [],
    categories: [],
    currentProduct: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      pages: 1,
      total: 0,
      limit: 12,
    },

    fetchProducts: async (params) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await api.products.getProducts(params);
        const { data, pagination } = response;

        set((state) => {
          state.products = data;
          state.pagination = pagination || state.pagination;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = handleApiError(error);
          state.isLoading = false;
        });
      }
    },

    fetchFeaturedProducts: async () => {
      try {
        const response = await api.products.getProducts({ featured: true, limit: 8 });
        set((state) => {
          state.featuredProducts = response.data;
        });
      } catch (error: any) {
        console.error('Failed to fetch featured products:', error);
      }
    },

    fetchProduct: async (id) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await api.products.getProduct(id);
        set((state) => {
          state.currentProduct = response.data;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = handleApiError(error);
          state.isLoading = false;
        });
      }
    },

    fetchCategories: async () => {
      try {
        const response = await api.products.getCategories();
        set((state) => {
          state.categories = response.data;
        });
      } catch (error: any) {
        console.error('Failed to fetch categories:', error);
      }
    },

    searchProducts: async (query, filters) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await api.products.searchProducts(query, filters);
        set((state) => {
          state.products = response.data;
          state.isLoading = false;
        });
      } catch (error: any) {
        set((state) => {
          state.error = handleApiError(error);
          state.isLoading = false;
        });
      }
    },

    clearProducts: () => {
      set((state) => {
        state.products = [];
        state.currentProduct = null;
      });
    },
  }))
);

// Initialize stores on app start
export const initializeStores = async () => {
  const authStore = useAuthStore.getState();
  const cartStore = useCartStore.getState();
  const wishlistStore = useWishlistStore.getState();
  const productsStore = useProductsStore.getState();

  // Check authentication
  await authStore.checkAuth();

  // If authenticated, fetch user data
  if (authStore.isAuthenticated) {
    await Promise.all([
      cartStore.fetchCart(),
      wishlistStore.fetchWishlist(),
    ]);
  }

  // Fetch initial data
  await Promise.all([
    productsStore.fetchFeaturedProducts(),
    productsStore.fetchCategories(),
  ]);
};