// src/components/search/product-filters.tsx
'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SearchFilters } from '@/types';

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
    { id: 'electronics', name: 'Electronics', count: 245 },
    { id: 'fashion', name: 'Fashion', count: 189 },
    { id: 'home-garden', name: 'Home & Garden', count: 156 },
    { id: 'sports', name: 'Sports & Outdoors', count: 134 },
    { id: 'books', name: 'Books', count: 98 },
    { id: 'beauty', name: 'Beauty & Health', count: 87 },
  ];

  const brands = [
    { id: 'apple', name: 'Apple', count: 45 },
    { id: 'samsung', name: 'Samsung', count: 38 },
    { id: 'nike', name: 'Nike', count: 32 },
    { id: 'sony', name: 'Sony', count: 28 },
    { id: 'lg', name: 'LG', count: 24 },
    { id: 'adidas', name: 'Adidas', count: 22 },
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

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="font-semibold">Categories</h3>
            <span className="text-2xl">{openSections.categories ? '−' : '+'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={filters.categories.includes(category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
              />
              <Label htmlFor={category.id} className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <span>{category.name}</span>
                  <span className="text-muted-foreground text-sm">({category.count})</span>
                </div>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Brands */}
      <Collapsible open={openSections.brands} onOpenChange={() => toggleSection('brands')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="font-semibold">Brands</h3>
            <span className="text-2xl">{openSections.brands ? '−' : '+'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          {brands.map((brand) => (
            <div key={brand.id} className="flex items-center space-x-2">
              <Checkbox
                id={brand.id}
                checked={filters.brands.includes(brand.id)}
                onCheckedChange={(checked) => handleBrandChange(brand.id, checked as boolean)}
              />
              <Label htmlFor={brand.id} className="flex-1 cursor-pointer">
                <div className="flex justify-between items-center">
                  <span>{brand.name}</span>
                  <span className="text-muted-foreground text-sm">({brand.count})</span>
                </div>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Price Range */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="font-semibold">Price Range</h3>
            <span className="text-2xl">{openSections.price ? '−' : '+'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-3">
          <Slider
            value={[filters.priceRange.min, filters.priceRange.max]}
            onValueChange={handlePriceChange}
            max={10000}
            min={0}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>KES {filters.priceRange.min}</span>
            <span>KES {filters.priceRange.max}</span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Rating */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="font-semibold">Rating</h3>
            <span className="text-2xl">{openSections.rating ? '−' : '+'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={filters.rating === rating}
                onCheckedChange={(checked) => 
                  onFiltersChange({ rating: checked ? rating : 0 })
                }
              />
              <Label htmlFor={`rating-${rating}`} className="flex items-center space-x-1 cursor-pointer">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">& up</span>
              </Label>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Availability & Features */}
      <Collapsible open={openSections.availability} onOpenChange={() => toggleSection('availability')}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
            <h3 className="font-semibold">Availability</h3>
            <span className="text-2xl">{openSections.availability ? '−' : '+'}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 mt-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={filters.inStock}
              onCheckedChange={(checked) => onFiltersChange({ inStock: checked as boolean })}
            />
            <Label htmlFor="in-stock" className="cursor-pointer">In Stock</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={filters.onSale}
              onCheckedChange={(checked) => onFiltersChange({ onSale: checked as boolean })}
            />
            <Label htmlFor="on-sale" className="cursor-pointer">On Sale</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-shipping"
              checked={filters.freeShipping}
              onCheckedChange={(checked) => onFiltersChange({ freeShipping: checked as boolean })}
            />
            <Label htmlFor="free-shipping" className="cursor-pointer">Free Shipping</Label>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// src/components/search/sort-dropdown.tsx
'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SortDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'discount', label: 'Highest Discount' },
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

