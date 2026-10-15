'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, User as UserIcon, Sparkles, Trash2, Minus, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/catalog/search-bar';
import { Drawer } from '@/components/ui/drawer';
import { formatCurrency } from '@/lib/utils';
import type { CartDetails } from '@/lib/cart/cart-service';

export function Header() {
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [cart, setCart] = React.useState<CartDetails | null>(null);
  const [isLoadingCart, setIsLoadingCart] = React.useState(false);

  const refreshCart = React.useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Error loading cart header:', err);
    }
  }, []);

  React.useEffect(() => {
    refreshCart();

    const handleCartUpdate = () => {
      refreshCart();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [refreshCart]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    setIsLoadingCart(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } finally {
      setIsLoadingCart(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    setIsLoadingCart(true);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } finally {
      setIsLoadingCart(false);
    }
  };

  const totalItems = cart?.totalItems || 0;
  const items = cart?.items || [];

  return (
    <>
      {/* 1. Announcement Bar */}
      <div className="bg-[#D3F8DF] border-b border-[#73E2A3] py-2 px-4 text-center">
        <p className="text-xs font-medium text-[#087443] flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Express nationwide delivery & authentic designer curation. Standard shipping flat rate.</span>
        </p>
      </div>

      {/* 2. Main Storefront Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E5E5E5]">
        <div className="container-storefront h-16 flex items-center justify-between gap-4">
          {/* Logo & Category Navigation */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="font-bold text-xl sm:text-2xl tracking-tighter text-[#141414] font-heading">
              LAAM <span className="font-normal text-xs uppercase tracking-widest text-[#737373] ml-1">STUDIO</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-medium text-[#424242]">
              <Link href="/products" className="hover:text-[#141414] transition-colors">All Designs</Link>
              <Link href="/category/pret" className="hover:text-[#141414] transition-colors">Pret</Link>
              <Link href="/category/festive" className="hover:text-[#141414] transition-colors">Luxury Festive</Link>
              <Link href="/category/unstitched" className="hover:text-[#141414] transition-colors">Unstitched</Link>
              <Link href="/categories" className="text-[#087443] font-semibold hover:underline">All Collections</Link>
            </nav>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md mx-2">
            <SearchBar />
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/wishlist"
              className="p-2 rounded-lg text-[#525252] hover:text-[#141414] hover:bg-neutral-100 transition-colors"
              aria-label="View Wishlist"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              href="/account"
              className="p-2 rounded-lg text-[#525252] hover:text-[#141414] hover:bg-neutral-100 transition-colors"
              aria-label="Account details"
            >
              <UserIcon className="w-5 h-5" />
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refreshCart();
                setIsCartOpen(true);
              }}
              className="gap-2"
              aria-label={`Open Shopping Bag. ${totalItems} items in bag`}
            >
              <ShoppingBag className="w-4 h-4 text-[#087443]" />
              <span className="hidden sm:inline">Bag</span>
              {totalItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#087443] text-white text-[10px] font-bold flex items-center justify-center animate-in zoom-in-50">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="sm:hidden px-4 pb-3">
          <SearchBar />
        </div>
      </header>

      {/* Cart Drawer */}
      <Drawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title={`Your Shopping Bag (${totalItems} ${totalItems === 1 ? 'Item' : 'Items'})`}
      >
        <div className="flex flex-col h-full justify-between space-y-6">
          {items.length > 0 ? (
            <>
              {/* Item List */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border border-[#E5E5E5] rounded-xl bg-white shadow-2xs"
                  >
                    <div className="relative w-16 h-20 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-[#E5E5E5]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.imageAlt}
                          fill
                          sizes="80px"
                          className="object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#737373]">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-[#141414] line-clamp-1">
                          {item.productTitle}
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          aria-label={`Remove ${item.productTitle}`}
                          className="text-[#737373] hover:text-[#B91C1C] p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-[#737373]">
                        {item.variantTitle}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        {/* Qty Selector */}
                        <div className="flex items-center border border-[#D6D6D6] rounded h-7 px-1 bg-white text-xs">
                          <button
                            type="button"
                            disabled={item.quantity <= 1 || isLoadingCart}
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                            className="p-0.5 text-[#737373] hover:text-[#141414] disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-medium">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.inventoryCount || isLoadingCart}
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                            className="p-0.5 text-[#737373] hover:text-[#141414] disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-[#141414]">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-[#E5E5E5] pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#737373]">Subtotal:</span>
                  <span className="font-bold text-[#141414]">{formatCurrency(cart?.subtotal || 0)}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-[#525252]">
                  <span>Shipping:</span>
                  <span className={cart?.shippingEstimate === 0 ? 'text-[#087443] font-bold' : ''}>
                    {cart?.shippingEstimate === 0 ? 'FREE' : formatCurrency(cart?.shippingEstimate || 0)}
                  </span>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full font-bold uppercase tracking-wider"
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push('/cart');
                    }}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setIsCartOpen(false);
                      router.push('/cart');
                    }}
                  >
                    View Shopping Bag Details
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-[#737373]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-[#141414]">Your bag is currently empty</h4>
                <p className="text-xs text-[#737373]">Find your next signature ensemble in our collections.</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsCartOpen(false);
                  router.push('/products');
                }}
              >
                Browse Designs
              </Button>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
}
