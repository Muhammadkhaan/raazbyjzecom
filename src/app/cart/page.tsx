'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import type { CartDetails, CartItemDetail } from '@/lib/cart/cart-service';

export default function CartPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [cart, setCart] = React.useState<CartDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [updatingItemId, setUpdatingItemId] = React.useState<string | null>(null);

  // Fetch Cart Details on Mount
  const fetchCart = React.useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Update Item Quantity
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await res.json();
      if (res.ok) {
        setCart(data.cart);
        if (data.warning) {
          showToast({
            type: 'warning',
            title: 'Stock Limit Reached',
            message: data.warning,
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Unable to update quantity',
          message: data.error || 'Server error',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not connect to shopping bag service.',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove Item
  const handleRemoveItem = async (itemId: string, productTitle: string) => {
    setUpdatingItemId(itemId);
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setCart(data.cart);
        showToast({
          type: 'info',
          title: 'Item Removed',
          message: `${productTitle} was removed from your bag.`,
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not remove item.',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading your shopping bag...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-10 sm:py-14 flex-1 space-y-8">
        {/* Breadcrumb & Title */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">Shopping Bag</li>
            </ol>
          </nav>
          <div className="flex items-baseline justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#141414]">
              Shopping Bag {cart && cart.totalItems > 0 && `(${cart.totalItems})`}
            </h1>
            <Link href="/products" className="text-xs font-semibold text-[#087443] hover:underline">
              Continue Shopping →
            </Link>
          </div>
        </div>

        {/* Revalidation Warnings Notice Banner */}
        {cart && cart.warnings && cart.warnings.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Bag Updated</span>
            </div>
            {cart.warnings.map((w, idx) => (
              <p key={idx} className="text-amber-800 text-[11px] pl-6">• {w}</p>
            ))}
          </div>
        )}

        {/* Cart Contents Grid */}
        {!isEmpty ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="divide-y divide-[#E5E5E5] border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-xs">
                {items.map((item) => {
                  const isUpdating = updatingItemId === item.id;
                  const isUnavailable = !item.isAvailable;

                  return (
                    <article
                      key={item.id}
                      className={`p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start transition-opacity ${
                        isUpdating ? 'opacity-60 pointer-events-none' : ''
                      } ${isUnavailable ? 'bg-[#FEF2F2]/40' : ''}`}
                    >
                      {/* Product Thumbnail */}
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="relative w-24 h-32 sm:w-28 sm:h-36 bg-neutral-100 rounded-xl overflow-hidden shrink-0 border border-[#E5E5E5]"
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.imageAlt}
                            fill
                            sizes="120px"
                            className="object-cover object-center"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#737373]">
                            No Image
                          </div>
                        )}
                      </Link>

                      {/* Product Details & Actions */}
                      <div className="flex-1 w-full flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h2 className="font-heading font-semibold text-base text-[#141414] leading-snug">
                              <Link href={`/product/${item.productSlug}`} className="hover:text-[#087443] transition-colors">
                                {item.productTitle}
                              </Link>
                            </h2>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id, item.productTitle)}
                              aria-label={`Remove ${item.productTitle} from shopping bag`}
                              className="text-[#737373] hover:text-[#B91C1C] p-1 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#B91C1C]"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <p className="text-xs text-[#525252]">
                            Variation: <span className="font-medium text-[#141414]">{item.variantTitle}</span>
                          </p>

                          {/* Notices */}
                          {item.stockNotice && (
                            <p className="text-[11px] font-medium text-[#B91C1C] flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{item.stockNotice}</span>
                            </p>
                          )}
                          {item.priceNotice && (
                            <p className="text-[11px] font-medium text-[#087443]">
                              {item.priceNotice}
                            </p>
                          )}
                        </div>

                        {/* Quantity and Price Row */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E5]/60">
                          {/* Quantity Selector */}
                          <div className="flex items-center border border-[#D6D6D6] rounded-lg h-9 px-1.5 bg-white">
                            <button
                              type="button"
                              disabled={item.quantity <= 1 || isUnavailable}
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="p-1 rounded text-[#737373] hover:text-[#141414] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#087443]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <span className="w-8 text-center text-xs font-semibold text-[#141414]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              disabled={item.quantity >= item.inventoryCount || isUnavailable}
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="p-1 rounded text-[#737373] hover:text-[#141414] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[#087443]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Item Subtotal */}
                          <div className="text-right">
                            <span className="block font-bold text-base text-[#141414]">
                              {formatCurrency(item.subtotal)}
                            </span>
                            <span className="text-[11px] text-[#737373]">
                              {formatCurrency(item.unitPrice)} each
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Guarantees Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-[#E5E5E5] bg-neutral-50 text-xs">
                <div className="flex items-center gap-2 text-[#525252]">
                  <Truck className="w-4 h-4 text-[#087443] shrink-0" />
                  <span>Free shipping on orders over PKR 10,000</span>
                </div>
                <div className="flex items-center gap-2 text-[#525252]">
                  <ShieldCheck className="w-4 h-4 text-[#087443] shrink-0" />
                  <span>100% Genuine Designer Fabrics</span>
                </div>
                <div className="flex items-center gap-2 text-[#525252]">
                  <RotateCcw className="w-4 h-4 text-[#087443] shrink-0" />
                  <span>7-Day Hassle-Free Sizing Exchanges</span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary (Visually Dominant Checkout Action) */}
            <div className="lg:col-span-4 sticky top-24">
              <Card className="p-6 space-y-6 border border-[#E5E5E5] shadow-sm bg-white">
                <h2 className="font-heading font-bold text-lg text-[#141414] border-b border-[#E5E5E5] pb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#525252]">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-[#141414]">{formatCurrency(cart?.subtotal || 0)}</span>
                  </div>

                  <div className="flex justify-between text-[#525252]">
                    <span>Estimated Shipping:</span>
                    <span className="font-semibold text-[#141414]">
                      {cart?.shippingEstimate === 0 ? (
                        <span className="text-[#087443] font-bold">FREE</span>
                      ) : (
                        formatCurrency(cart?.shippingEstimate || 0)
                      )}
                    </span>
                  </div>

                  {cart?.shippingEstimate === 0 && (
                    <div className="p-2 rounded-lg bg-[#D3F8DF] border border-[#73E2A3] text-[#087443] text-[11px] font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Congratulations! You qualify for Free Domestic Express Delivery.</span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#E5E5E5] flex justify-between items-baseline">
                    <span className="text-base font-bold text-[#141414]">Total:</span>
                    <span className="text-xl font-extrabold text-[#141414]">
                      {formatCurrency(cart?.grandTotal || 0)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737373]">Taxes included in product price.</p>
                </div>

                {/* VISUALLY DOMINANT CHECKOUT CTA */}
                <div className="space-y-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={cart?.hasUnavailableItems || isEmpty}
                    onClick={() => {
                      showToast({
                        type: 'info',
                        title: 'Checkout Pipeline Active',
                        message: 'Checkout and payment collection scheduled for Phase 5.',
                      });
                    }}
                    className="w-full h-14 text-sm uppercase tracking-wider font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  {cart?.hasUnavailableItems && (
                    <p className="text-xs text-[#B91C1C] text-center font-medium">
                      Please remove unavailable items to proceed to checkout.
                    </p>
                  )}
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-[#737373]">
                    🔒 Secure 256-Bit SSL Encrypted Checkout
                  </p>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Your Shopping Bag is Empty"
            description="Explore our authentic prêt coordinates, unstitched luxury lawn, and hand-crafted festive curations to find your next staple ensemble."
            actionLabel="Discover New Arrivals"
            onAction={() => router.push('/products')}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
