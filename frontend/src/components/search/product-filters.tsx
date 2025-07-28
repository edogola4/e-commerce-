// src/components/search/product-filters.tsx
'use client';

import { useState } from 'react';
import { 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Filter,
  Sparkles,
  Tag,
  Package,
  Truck,
  Zap,
  Heart,
  TrendingUp,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SearchFilters } from '@/types';
import { cn } from '@/lib/utils';

interface ProductFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const [openSections, setOpenSections] = useState({
    categories: true,
    brands: true,
    price: true,
    rating: true,
    availability: true,
  });

  const categories = [
    { id: 'electronics', name: 'Electronics', count: 245, icon: '💻', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'fashion', name: 'Fashion', count: 189, icon: '👕', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
    { id: 'home-garden', name: 'Home & Garden', count: 156, icon: '🏠', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    { id: 'sports', name: 'Sports & Outdoors', count: 134, icon: '⚽', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    { id: 'books', name: 'Books', count: 98, icon: '📚', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { id: 'beauty', name: 'Beauty & Health', count: 87, icon: '💄', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ];

  const brands = [
    { id: 'apple', name: 'Apple', count: 45, premium: true },
    { id: 'samsung', name: 'Samsung', count: 38, premium: true },
    { id: 'nike', name: 'Nike', count: 32, premium: false },
    { id: 'sony', name: 'Sony', count: 28, premium: true },
    { id: 'lg', name: 'LG', count: 24, premium: false },
    { id: 'adidas', name: 'Adidas', count: 22, premium: false },
  ];

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter(id => id !== categoryId);
    onFiltersChange({ categories: newCategories });
  };

  const handleBrandChange = (brandId: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brandId]
      : filters.brands.filter(id => id !== brandId);
    onFiltersChange({ brands: newBrands });
  };

  const handlePriceChange = (values: number[]) => {
    onFiltersChange({
      priceRange: { min: values[0], max: values[1] }
    });
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveFiltersCount = () => {
    return filters.categories.length + 
           filters.brands.length + 
           (filters.rating > 0 ? 1 : 0) + 
           (filters.inStock ? 1 : 0) + 
           (filters.onSale ? 1 : 0) + 
           (filters.freeShipping ? 1 : 0);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 10000 },
      rating: 0,
      inStock: false,
      onSale: false,
      freeShipping: false
    });
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Filter className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Filters</h2>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {getActiveFiltersCount()} active
              </Badge>
            )}
          </div>
        </div>
        
        {getActiveFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 group"
          >
            <X className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
            Clear All
          </Button>
        )}
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Categories */}
      <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Tag className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Categories</h3>
              {filters.categories.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {filters.categories.length}
                </Badge>
              )}
            </div>
            {openSections.categories ? 
              <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" /> : 
              <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-4 animate-in slide-in-from-top duration-300">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="group flex items-center space-x-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Checkbox
                id={category.id}
                checked={filters.categories.includes(category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600 border-2"
              />
              <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg group-hover:scale-125 transition-transform duration-300">
                      {category.icon}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">{category.name}</span>
                  </div>
                  <Badge variant="outline" className={category.color}>
                    {category.count}
                  </Badge>
                </div>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Brands */}
      <Collapsible open={openSections.brands} onOpenChange={() => toggleSection('brands')}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Brands</h3>
              {filters.brands.length > 0 && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {filters.brands.length}
                </Badge>
              )}
            </div>
            {openSections.brands ? 
              <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" /> : 
              <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-4 animate-in slide-in-from-top duration-300">
          {brands.map((brand) => (
            <div 
              key={brand.id} 
              className="group flex items-center space-x-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Checkbox
                id={brand.id}
                checked={filters.brands.includes(brand.id)}
                onCheckedChange={(checked) => handleBrandChange(brand.id, checked as boolean)}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-600 border-2"
              />
              <Label htmlFor={brand.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-slate-900 dark:text-slate-100">{brand.name}</span>
                    {brand.premium && (
                      <Sparkles className="h-4 w-4 text-yellow-500 group-hover:animate-pulse" />
                    )}
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {brand.count}
                  </Badge>
                </div>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Price Range */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Price Range</h3>
            </div>
            {openSections.price ? 
              <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" /> : 
              <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 mt-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200/50 dark:border-green-800/50 animate-in slide-in-from-top duration-300">
          <Slider
            value={[filters.priceRange.min, filters.priceRange.max]}
            onValueChange={handlePriceChange}
            max={10000}
            min={0}
            step={100}
            className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-green-500 [&_[role=slider]]:to-emerald-600 [&_[role=slider]]:border-2 [&_[role=slider]]:border-white [&_[role=slider]]:shadow-lg"
          />
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                KES {filters.priceRange.min.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Minimum</div>
            </div>
            <div className="px-4">
              <div className="w-8 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                KES {filters.priceRange.max.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Maximum</div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Rating */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Star className="h-5 w-5 text-yellow-500 fill-current" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Rating</h3>
              {filters.rating > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                  {filters.rating}+ stars
                </Badge>
              )}
            </div>
            {openSections.rating ? 
              <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" /> : 
              <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-4 animate-in slide-in-from-top duration-300">
          {[4, 3, 2, 1].map((rating) => (
            <div 
              key={rating} 
              className="group flex items-center space-x-3 p-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={(checked) => 
                  onFiltersChange({ rating: checked ? rating : 0 })
                }
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-500 data-[state=checked]:to-orange-500 border-2"
              />
              <Label htmlFor={`rating-${rating}`} className="flex items-center space-x-3 cursor-pointer flex-1">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn(
                          "h-4 w-4 transition-all duration-300",
                          i < rating ? 'text-yellow-500 fill-current' : 'text-slate-300 dark:text-slate-600'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">& up</span>
                </div>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Availability & Features */}
      <Collapsible open={openSections.availability} onOpenChange={() => toggleSection('availability')}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between p-3 h-auto hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Availability</h3>
              {(filters.inStock || filters.onSale || filters.freeShipping) && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Active
                </Badge>
              )}
            </div>
            {openSections.availability ? 
              <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" /> : 
              <ChevronDown className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" />
            }
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-4 animate-in slide-in-from-top duration-300">
          <div className="group flex items-center space-x-3 p-3 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all duration-300 hover:scale-105">
            <Checkbox
              id="in-stock"
              checked={filters.inStock}
              onCheckedChange={(checked) => onFiltersChange({ inStock: checked as boolean })}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600 border-2"
            />
            <Label htmlFor="in-stock" className="flex items-center space-x-3 cursor-pointer flex-1">
              <Package className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium text-slate-900 dark:text-slate-100">In Stock</span>
            </Label>
          </div>

          <div className="group flex items-center space-x-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 hover:scale-105">
            <Checkbox
              id="on-sale"
              checked={filters.onSale}
              onCheckedChange={(checked) => onFiltersChange({ onSale: checked as boolean })}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-500 data-[state=checked]:to-pink-600 border-2"
            />
            <Label htmlFor="on-sale" className="flex items-center space-x-3 cursor-pointer flex-1">
              <Zap className="h-4 w-4 text-red-600 group-hover:scale-110 group-hover:animate-pulse transition-all duration-300" />
              <span className="font-medium text-slate-900 dark:text-slate-100">On Sale</span>
            </Label>
          </div>

          <div className="group flex items-center space-x-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-300 hover:scale-105">
            <Checkbox
              id="free-shipping"
              checked={filters.freeShipping}
              onCheckedChange={(checked) => onFiltersChange({ freeShipping: checked as boolean })}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-cyan-600 border-2"
            />
            <Label htmlFor="free-shipping" className="flex items-center space-x-3 cursor-pointer flex-1">
              <Truck className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              <span className="font-medium text-slate-900 dark:text-slate-100">Free Shipping</span>
            </Label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Quick Actions */}
      {getActiveFiltersCount() > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 border border-blue-200/50 dark:border-blue-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Heart className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">Save this search</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Get notified of new matches</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// src/components/search/sort-dropdown.tsx
'use client';

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Clock, 
  Heart, 
  Zap 
} from 'lucide-react';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const sortOptions = [
    { 
      value: 'relevance', 
      label: 'Relevance', 
      icon: ArrowUpDown,
      description: 'Best match for your search'
    },
    { 
      value: 'price-low', 
      label: 'Price: Low to High', 
      icon: TrendingUp,
      description: 'Cheapest first'
    },
    { 
      value: 'price-high', 
      label: 'Price: High to Low', 
      icon: TrendingDown,
      description: 'Most expensive first'
    },
    { 
      value: 'rating', 
      label: 'Customer Rating', 
      icon: Star,
      description: 'Highest rated first'
    },
    { 
      value: 'newest', 
      label: 'Newest First', 
      icon: Clock,
      description: 'Recently added'
    },
    { 
      value: 'popularity', 
      label: 'Most Popular', 
      icon: Heart,
      description: 'Trending products'
    },
    { 
      value: 'discount', 
      label: 'Highest Discount', 
      icon: Zap,
      description: 'Best deals first'
    },
  ];

  const currentOption = sortOptions.find(option => option.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-64 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-center space-x-3">
          {currentOption && (
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <currentOption.icon className="h-4 w-4 text-white" />
            </div>
          )}
          <div className="text-left">
            <SelectValue placeholder="Sort by..." className="font-medium" />
            {currentOption && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {currentOption.description}
              </div>
            )}
          </div>
        </div>
      </SelectTrigger>
      <SelectContent className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl">
        {sortOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="group p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl mx-2 my-1 cursor-pointer transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-3 w-full">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <option.icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-slate-100">
                  {option.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {option.description}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}