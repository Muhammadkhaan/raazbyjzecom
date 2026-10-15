'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer } from '@/components/ui/drawer';

export interface ProductFiltersProps {
  categories: { id: string; name: string; slug: string; productCount: number }[];
  facets: {
    sizes: string[];
    colors: string[];
  };
  currentCategorySlug?: string;
  totalProducts: number;
}

export function ProductFilters({
  categories,
  facets,
  currentCategorySlug,
  totalProducts,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

  // Read current filters from URL search params
  const activeSort = searchParams.get('sort') || 'newest';
  const activeSize = searchParams.get('size') || '';
  const activeColor = searchParams.get('color') || '';
  const activeInStock = searchParams.get('inStock') === 'true';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeCategory = currentCategorySlug || searchParams.get('category') || '';

  // Count active non-default filters
  const activeFilterCount = [
    activeSize,
    activeColor,
    activeInStock,
    activeMinPrice,
    activeMaxPrice,
    !currentCategorySlug && activeCategory,
  ].filter(Boolean).length;

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination to page 1 whenever filters change
    params.delete('page');

    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (activeSort && activeSort !== 'newest') {
      params.set('sort', activeSort);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const FilterFormContent = () => (
    <div className="space-y-6">
      {/* 1. Category Filter (If not already locked on category page) */}
      {!currentCategorySlug && (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
            Department
          </legend>
          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => updateFilters({ category: null })}
              className={`block w-full text-left text-xs py-1 px-2 rounded-md transition-colors ${
                !activeCategory
                  ? 'bg-[#141414] text-white font-medium'
                  : 'text-[#525252] hover:bg-neutral-100'
              }`}
            >
              All Collections
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilters({ category: cat.slug })}
                className={`flex items-center justify-between w-full text-left text-xs py-1 px-2 rounded-md transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-[#141414] text-white font-medium'
                    : 'text-[#525252] hover:bg-neutral-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] ${activeCategory === cat.slug ? 'text-neutral-300' : 'text-[#737373]'}`}>
                  {cat.productCount}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* 2. In-Stock Availability */}
      <fieldset className="space-y-2 pt-2 border-t border-[#E5E5E5]">
        <legend className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
          Availability
        </legend>
        <div className="pt-1">
          <Checkbox
            id="inStockOnly"
            checked={activeInStock}
            onChange={(e) => updateFilters({ inStock: e.target.checked ? 'true' : null })}
            label="In Stock items only"
            helperText="Exclude back-order items"
          />
        </div>
      </fieldset>

      {/* 3. Sizes */}
      {facets.sizes.length > 0 && (
        <fieldset className="space-y-2 pt-2 border-t border-[#E5E5E5]">
          <legend className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
            Size
          </legend>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => updateFilters({ size: null })}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                !activeSize
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'bg-white text-[#525252] border-[#D6D6D6] hover:border-[#141414]'
              }`}
            >
              All
            </button>
            {facets.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => updateFilters({ size: activeSize === s ? null : s })}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  activeSize === s
                    ? 'bg-[#087443] text-white border-[#087443]'
                    : 'bg-white text-[#525252] border-[#D6D6D6] hover:border-[#141414]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* 4. Colors */}
      {facets.colors.length > 0 && (
        <fieldset className="space-y-2 pt-2 border-t border-[#E5E5E5]">
          <legend className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
            Color
          </legend>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {facets.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => updateFilters({ color: activeColor === c ? null : c })}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  activeColor === c
                    ? 'bg-[#141414] text-white border-[#141414]'
                    : 'bg-white text-[#525252] border-[#D6D6D6] hover:border-[#141414]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* 5. Price Range */}
      <fieldset className="space-y-2 pt-2 border-t border-[#E5E5E5]">
        <legend className="text-xs font-semibold uppercase tracking-wider text-[#141414]">
          Price Range (PKR)
        </legend>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Input
            type="number"
            placeholder="Min"
            aria-label="Minimum price"
            value={activeMinPrice}
            onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
            className="h-8 text-xs"
          />
          <Input
            type="number"
            placeholder="Max"
            aria-label="Maximum price"
            value={activeMaxPrice}
            onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
            className="h-8 text-xs"
          />
        </div>
      </fieldset>

      {/* Clear Filters CTA */}
      {activeFilterCount > 0 && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="w-full gap-1.5 text-xs text-[#B91C1C] border-[#FECACA] hover:bg-[#FEF2F2]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset {activeFilterCount} Active Filters</span>
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Mobile Trigger & Sort Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#E5E5E5] mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden gap-1.5"
            aria-label={`Open filter options. ${activeFilterCount} filters active`}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#141414]" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#141414] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <span className="text-xs text-[#737373]">
            Showing <strong className="text-[#141414] font-semibold">{totalProducts}</strong> designs
          </span>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs text-[#737373] whitespace-nowrap">
            Sort by:
          </label>
          <select
            id="catalog-sort"
            value={activeSort}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            className="h-9 px-3 py-1 text-xs text-[#141414] bg-white border border-[#D6D6D6] rounded-lg focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443] cursor-pointer"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="popular">Most Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Desktop Sidebar Filter View */}
      <aside className="hidden md:block w-64 shrink-0 pr-6 border-r border-[#E5E5E5]">
        <div className="sticky top-20 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
            <h2 className="text-sm font-bold tracking-tight text-[#141414]">Filter Catalog</h2>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-[#B91C1C] hover:underline"
              >
                Clear All
              </button>
            )}
          </div>
          <FilterFormContent />
        </div>
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Refine Collection"
        position="left"
      >
        <div className="py-2">
          <FilterFormContent />
          <div className="pt-6 mt-6 border-t border-[#E5E5E5]">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setMobileDrawerOpen(false)}
            >
              Apply Filters ({totalProducts} Results)
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
