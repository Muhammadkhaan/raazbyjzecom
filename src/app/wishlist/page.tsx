'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ArrowRight, ShoppingBag, Loader2, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import type { WishlistItemDetail } from '@/lib/wishlist/wishlist-service';

export default function WishlistPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [items, setItems] = React.useState<WishlistItemDetail[]>([]);
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [removingId, setRemovingId] = React.useState<string | null>(null);

  const fetchWishlist = React.useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setIsAuthenticated(data.isAuthenticated !== false);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: string, title: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/wishlist/items/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        showToast({
          type: 'info',
          title: 'Removed from Wishlist',
          message: `${title} was removed from your saved items.`,
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not remove item from wishlist.',
      });
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading your saved wishlist...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-10 sm:py-14 flex-1 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">Wishlist</li>
            </ol>
          </nav>
          <div className="flex items-baseline justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#141414]">
              Saved Wishlist ({items.length})
            </h1>
            <Link href="/products" className="text-xs font-semibold text-[#087443] hover:underline">
              Continue Shopping →
            </Link>
          </div>
        </div>

        {/* Guest Warning Banner */}
        {!isAuthenticated && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-[#B91C1C] flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>You are currently browsing as a guest</span>
              </h3>
              <p className="text-[11px] text-[#525252]">
                Sign in to your customer account to save your wishlist permanently and access it across any mobile or desktop device.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-[#141414] text-white hover:bg-[#424242] transition-colors shrink-0"
            >
              Sign In to Sync
            </Link>
          </div>
        )}

        {/* Wishlist Grid */}
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => {
              const isRemoving = removingId === item.productId;

              return (
                <article
                  key={item.id}
                  className={`group relative flex flex-col rounded-xl border border-[#E5E5E5] bg-white overflow-hidden transition-all duration-200 hover:shadow-md ${
                    isRemoving ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {/* Image */}
                  <Link
                    href={`/product/${item.slug}`}
                    className="relative aspect-[3/4] w-full bg-neutral-100 overflow-hidden block"
                  >
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#737373]">
                        No Image
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                      {item.discountPercentage && (
                        <Badge variant="blush" size="sm">
                          {item.discountPercentage}% OFF
                        </Badge>
                      )}
                    </div>

                    {!item.isAvailable && (
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 py-1 px-2 rounded-md bg-[#141414]/80 text-white text-[11px] font-semibold text-center backdrop-blur-xs">
                        Currently Unavailable
                      </div>
                    )}
                  </Link>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId, item.title)}
                    aria-label={`Remove ${item.title} from wishlist`}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-white text-[#737373] hover:text-[#B91C1C] shadow-xs transition-colors z-20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#737373]">
                        {item.categoryName}
                      </span>
                      <h3 className="font-heading font-medium text-xs sm:text-sm text-[#141414] line-clamp-2 leading-snug">
                        <Link href={`/product/${item.slug}`} className="hover:text-[#087443] transition-colors">
                          {item.title}
                        </Link>
                      </h3>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-[#E5E5E5]/60">
                      <div className="flex items-baseline gap-2">
                        {item.salePrice ? (
                          <>
                            <span className="font-bold text-sm text-[#141414]">
                              {formatCurrency(item.salePrice)}
                            </span>
                            <span className="text-xs text-[#737373] line-through">
                              {formatCurrency(item.regularPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-sm text-[#141414]">
                            {formatCurrency(item.regularPrice)}
                          </span>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!item.isAvailable}
                        onClick={() => router.push(`/product/${item.slug}`)}
                        className="w-full gap-1.5 text-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Select Size & Buy</span>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Your Wishlist is Empty"
            description="Keep track of your favorite embroidered coordinates, bridal couture, and luxury lawn pieces by saving them as you browse."
            actionLabel="Browse Collections"
            onAction={() => router.push('/products')}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
