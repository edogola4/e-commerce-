'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchCommand } from '@/components/common/search-command';
import { useUIStore } from '@/store';
import { useDebounce } from '@/hooks';

export function SearchModal() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  
  const { searchModalOpen, toggleSearchModal } = useUIStore();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    setIsOpen(searchModalOpen);
    if (searchModalOpen) {
      // Focus the input when modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Clear query when modal closes
      setQuery('');
    }
  }, [searchModalOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search modal with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearchModal();
      }
      
      // Close with Escape
      if (e.key === 'Escape' && searchModalOpen) {
        toggleSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, toggleSearchModal]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      toggleSearchModal();
      setQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const handleProductSelect = (product: any) => {
    router.push(`/products/${product.slug || product._id}`);
    toggleSearchModal();
    setQuery('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={toggleSearchModal}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3" />
          <Input
            ref={inputRef}
            type="search"
            placeholder="Search for products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
          />
          <div className="flex items-center space-x-2 ml-3">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          <SearchCommand
            query={debouncedQuery}
            onClose={toggleSearchModal}
            onSelect={handleProductSelect}
            className="border-0 shadow-none"
          />
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Search powered by our AI recommendation engine</span>
            <div className="flex items-center space-x-1">
              <kbd className="inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-xs">
                ⌘K
              </kbd>
              <span>to search</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}