'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, AlertCircle, Minus, Plus, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface ProductVariantData {
  id: string;
  sku: string;
  title: string;
  size: string | null;
  color: string | null;
  priceOverride: number | null;
  inventoryCount: number;
  isAvailable: boolean;
}

export interface VariantSelectorProps {
  productId: string;
  productTitle: string;
  variants: ProductVariantData[];
  basePrice: number;
}

export function VariantSelector({
  productId,
  productTitle,
  variants,
  basePrice,
}: VariantSelectorProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // Extract unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean) as string[]));
  const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean) as string[]));

  // Default selection
  const [selectedSize, setSelectedSize] = React.useState<string>(sizes[0] || '');
  const [selectedColor, setSelectedColor] = React.useState<string>(colors[0] || '');
  const [quantity, setQuantity] = React.useState<number>(1);
  const [isAdding, setIsAdding] = React.useState<boolean>(false);
  const [isSavingWishlist, setIsSavingWishlist] = React.useState<boolean>(false);

  // Find currently matched variant
  const currentVariant = React.useMemo(() => {
    return variants.find((v) => {
      const matchSize = !selectedSize || v.size === selectedSize;
      const matchColor = !selectedColor || v.color === selectedColor;
      return matchSize && matchColor;
    });
  }, [variants, selectedSize, selectedColor]);

  // Stock status of matched variant
  const inStock = Boolean(
    currentVariant && currentVariant.isAvailable && currentVariant.inventoryCount > 0
  );
  const maxAvailable = currentVariant ? currentVariant.inventoryCount : 0;

  // Reset quantity if stock cap changes
  React.useEffect(() => {
    setQuantity(1);
  }, [selectedSize, selectedColor]);

  const handleAddToCart = async () => {
    if (!currentVariant || !inStock) return;

    setIsAdding(true);
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: currentVariant.id,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Unable to Add to Bag',
          message: data.error || 'Server error',
        });
      } else {
        // Dispatch cart update event
        window.dispatchEvent(new Event('cart-updated'));

        showToast({
          type: 'success',
          title: 'Added to Shopping Bag',
          message: `${quantity}x ${productTitle} (${currentVariant.title}) added to your bag.`,
        });

        if (data.warning) {
          showToast({
            type: 'warning',
            title: 'Stock Adjustment',
            message: data.warning,
          });
        }
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to shopping bag service.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    setIsSavingWishlist(true);
    try {
      const res = await fetch('/api/wishlist/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Saved to Wishlist',
          message: `${productTitle} was added to your saved wishlist.`,
        });
      } else if (res.status === 401) {
        showToast({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in to save items to your permanent wishlist.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Could not save to wishlist.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to update wishlist.',
      });
    } finally {
      setIsSavingWishlist(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Color Selector */}
      {colors.length > 0 && (
        <fieldset className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <legend className="font-semibold uppercase tracking-wider text-[#141414]">
              Color: <span className="font-normal text-[#525252] normal-case">{selectedColor}</span>
            </legend>
          </div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Available Colors">
            {colors.map((color) => {
              const isSelected = selectedColor === color;
              const hasColorStock = variants.some(
                (v) => v.color === color && v.inventoryCount > 0 && v.isAvailable
              );

              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#087443]',
                    isSelected
                      ? 'border-[#087443] bg-[#D3F8DF] text-[#087443] font-semibold ring-1 ring-[#087443]'
                      : 'border-[#D6D6D6] bg-white text-[#141414] hover:border-[#141414]',
                    !hasColorStock && 'opacity-60'
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 2. Size Selector */}
      {sizes.length > 0 && (
        <fieldset className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <legend className="font-semibold uppercase tracking-wider text-[#141414]">
              Select Size: <span className="font-normal text-[#525252] normal-case">{selectedSize}</span>
            </legend>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" role="radiogroup" aria-label="Available Sizes">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              const variantForSize = variants.find(
                (v) => v.size === size && (!selectedColor || v.color === selectedColor)
              );
              const isSizeAvailable = Boolean(variantForSize && variantForSize.inventoryCount > 0);

              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSize(size)}
                  className={cn(
                    'h-11 rounded-lg text-xs font-semibold border flex flex-col items-center justify-center transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#087443]',
                    isSelected
                      ? 'border-[#141414] bg-[#141414] text-white shadow-xs'
                      : 'border-[#D6D6D6] bg-white text-[#141414] hover:border-[#141414]',
                    !isSizeAvailable && 'opacity-40 bg-neutral-100 line-through text-[#737373]'
                  )}
                >
                  <span>{size}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* 3. Real Inventory & SKU Display */}
      <div className="p-3 rounded-lg border border-[#E5E5E5] bg-neutral-50/60 flex items-center justify-between text-xs">
        <div>
          <span className="text-[#737373] block text-[11px]">SKU: {currentVariant ? currentVariant.sku : 'N/A'}</span>
          {inStock ? (
            <span className="text-[#087443] font-medium flex items-center gap-1 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#087443] inline-block animate-pulse" />
              In Stock ({maxAvailable} available)
            </span>
          ) : (
            <span className="text-[#B91C1C] font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Currently Sold Out in this variation
            </span>
          )}
        </div>
      </div>

      {/* 4. Quantity, Add to Cart & Wishlist Actions */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center border border-[#D6D6D6] rounded-lg h-12 px-2 bg-white w-full sm:w-36 justify-between">
            <button
              type="button"
              disabled={quantity <= 1 || !inStock || isAdding}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="p-1 rounded text-[#737373] hover:text-[#141414] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#087443]"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="font-semibold text-sm text-[#141414] select-none" aria-live="polite">
              {quantity}
            </span>

            <button
              type="button"
              disabled={quantity >= maxAvailable || !inStock || isAdding}
              onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
              aria-label="Increase quantity"
              className="p-1 rounded text-[#737373] hover:text-[#141414] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#087443]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!inStock}
            isLoading={isAdding}
            onClick={handleAddToCart}
            className="flex-1 w-full h-12 gap-2 text-sm uppercase tracking-wider font-semibold"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{inStock ? 'Add to Shopping Bag' : 'Out of Stock'}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            isLoading={isSavingWishlist}
            onClick={handleToggleWishlist}
            aria-label="Save to Wishlist"
            className="h-12 w-12 sm:w-14 p-0 shrink-0 border-[#D6D6D6] hover:border-[#141414] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
