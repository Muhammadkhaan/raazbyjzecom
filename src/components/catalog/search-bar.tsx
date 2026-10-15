'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  regularPrice: number;
  salePrice: number | null;
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState<number>(-1);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  // Debounced search query
  React.useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/catalog/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen((data.suggestions || []).length > 0);
          setFocusedIndex(-1);
        }
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
        router.push(`/product/${suggestions[focusedIndex].slug}`);
        setIsOpen(false);
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit} role="search" className="relative flex items-center">
        <div className="absolute left-3 text-[#737373] pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#087443]" />
          ) : (
            <Search className="w-4 h-4" aria-hidden="true" />
          )}
        </div>

        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={focusedIndex >= 0 ? `${listboxId}-suggestion-${focusedIndex}` : undefined}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search embroidered kurtas, lawn, shawls..."
          className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm text-[#141414] bg-neutral-100 rounded-full border border-transparent transition-all placeholder:text-[#737373] focus:bg-white focus:border-[#087443] focus:ring-1 focus:ring-[#087443] focus:outline-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            aria-label="Clear search input"
            className="absolute right-2.5 p-1 rounded-full text-[#737373] hover:text-[#141414] hover:bg-neutral-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-xl border border-[#D6D6D6] shadow-xl overflow-hidden py-1 max-h-80 overflow-y-auto"
        >
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              id={`${listboxId}-suggestion-${idx}`}
              role="option"
              aria-selected={focusedIndex === idx}
              className={`px-4 py-2.5 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                focusedIndex === idx ? 'bg-[#D3F8DF]/60 text-[#087443]' : 'hover:bg-neutral-50 text-[#141414]'
              }`}
              onClick={() => {
                router.push(`/product/${item.slug}`);
                setIsOpen(false);
              }}
            >
              <div className="flex flex-col">
                <span className="font-medium line-clamp-1">{item.title}</span>
                <span className="text-[10px] text-[#737373]">{item.categoryName}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#737373] shrink-0 ml-2" />
            </li>
          ))}
          <li className="px-4 py-2 border-t border-[#E5E5E5] bg-neutral-50">
            <button
              type="button"
              onClick={handleSubmit}
              className="text-[11px] font-semibold text-[#087443] hover:underline w-full text-left"
            >
              See all results for &quot;{query}&quot; →
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
