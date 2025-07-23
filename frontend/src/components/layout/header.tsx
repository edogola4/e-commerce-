"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  X, 
  LogOut,
  Package,
  Settings,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks';
import { useCartStore, useWishlistStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { SearchCommand } from '@/components/common/search-command';
import { ThemeToggle } from '@/components/common/theme-toggle';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouter();
  
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { 
    mobileMenuOpen, 
    toggleMobileMenu, 
    toggleCartModal, 
    toggleWishlistModal,
    toggleSearchModal 
  } = useUIStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const cartItemCount = cart.itemCount || 0;
  const wishlistItemCount = wishlistItems.length || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="hidden lg:block border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex h-10 items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Free shipping on orders over KES 1,000</span>
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/contact" className="hover:text-primary">
                Help & Support
              </Link>
              <Link href="/track-order" className="hover:text-primary">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">E</span>
              </div>
              <span className="hidden sm:block text-xl font-bold">ECommercy</span>
            </Link>
          </div>

          {/* Search bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
                onFocus={() => setIsSearchOpen(true)}
              />
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50">
                  <SearchCommand 
                    query={searchQuery}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={(product: { slug?: string; _id: string }) => {
                        router.push(`/products/${product.slug || product._id}`);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}                      
                  />
                </div>
              )}
            </form>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Search button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleSearchModal}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWishlistModal}
              className="relative"
              aria-label={`Wishlist (${wishlistItemCount} items)`}
            >
              <Heart className="h-5 w-5" />
              {wishlistItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                </Badge>
              )}
            </Button>

            {/* Shopping cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCartModal}
              className="relative"
              aria-label={`Shopping cart (${cartItemCount} items)`}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </Badge>
              )}
            </Button>

            {/* User account */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation menu - Desktop */}
      <nav className="hidden lg:block border-t">
        <div className="container mx-auto px-4">
          <div className="flex h-12 items-center space-x-8">
            <Link
              href="/categories"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              All Categories
            </Link>
            <Link
              href="/categories/electronics"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Electronics
            </Link>
            <Link
              href="/categories/fashion"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Fashion
            </Link>
            <Link
              href="/categories/home-garden"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Home & Garden
            </Link>
            <Link
              href="/categories/sports"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sports & Outdoors
            </Link>
            <Link
              href="/categories/books"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Books
            </Link>
            <Link
              href="/deals"
              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Today's Deals
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </form>

            {/* Mobile navigation links */}
            <div className="space-y-2">
              <Link
                href="/categories"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={toggleMobileMenu}
              >
                All Categories
              </Link>
              <Link
                href="/categories/electronics"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={toggleMobileMenu}
              >
                Electronics
              </Link>
              <Link
                href="/categories/fashion"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={toggleMobileMenu}
              >
                Fashion
              </Link>
              <Link
                href="/categories/home-garden"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={toggleMobileMenu}
              >
                Home & Garden
              </Link>
              <Link
                href="/categories/sports"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={toggleMobileMenu}
              >
                Sports & Outdoors
              </Link>
              <Link
                href="/categories/books"
                className="block py-2 text-sm font-medium hover:text-primary transition-colors"
                onClick={toggleMobileMenu}
              >
                Books
              </Link>
              <Link
                href="/deals"
                className="block py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                onClick={toggleMobileMenu}
              >
                Today's Deals
              </Link>
            </div>

            {/* Mobile auth buttons */}
            {!isAuthenticated && (
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/login" onClick={toggleMobileMenu}>Login</Link>
                </Button>
                <Button size="sm" className="flex-1" asChild>
                  <Link href="/register" onClick={toggleMobileMenu}>Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}