'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, ArrowRight, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/catalog/pagination';
import { formatCurrency } from '@/lib/utils';

function OrdersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [orders, setOrders] = React.useState<any[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/account/orders?page=${currentPage}&pageSize=8`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
        } else if (res.status === 401) {
          router.push('/');
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [currentPage, router]);

  if (isLoading) {
    return (
      <div className="py-20 flex-1 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
        <p className="text-xs text-[#737373]">Loading your order history...</p>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb & Title */}
      <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
        <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li>/</li>
            <li><Link href="/account" className="hover:underline">My Account</Link></li>
            <li>/</li>
            <li className="font-semibold text-[#141414]">Order History</li>
          </ol>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
              Order History ({totalCount})
            </h1>
            <p className="text-xs text-[#737373]">
              Track order progress, view purchase receipts, and examine item snapshots.
            </p>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <AccountNav />

        <section className="flex-1 w-full space-y-6">
          {orders.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-4">
                {orders.map((order) => {
                  const isPaid = order.paymentStatus === 'PAID';
                  const isDelivered = order.fulfillmentStatus === 'DELIVERED';

                  return (
                    <Card
                      key={order.id}
                      className="p-5 sm:p-6 border border-[#E5E5E5] bg-white rounded-2xl space-y-4 shadow-2xs hover:border-[#D6D6D6] transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-[#141414]">
                            #{order.orderNumber}
                          </span>
                          <span className="text-[#737373]">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={isPaid ? 'mint' : 'outline'} size="sm">
                            {order.paymentStatus}
                          </Badge>
                          <Badge variant={isDelivered ? 'mint' : 'neutral'} size="sm">
                            {order.fulfillmentStatus}
                          </Badge>
                        </div>
                      </div>

                      {/* Order Item Highlights */}
                      <div className="space-y-2 text-xs">
                        {order.items.slice(0, 2).map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-[#525252]">
                            <span>
                              {item.productTitle} ({item.variantTitle}) × {item.quantity}
                            </span>
                            <span className="font-medium text-[#141414]">
                              {formatCurrency(item.total)}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <p className="text-[11px] text-[#737373]">
                            + {order.items.length - 2} additional {order.items.length - 2 === 1 ? 'item' : 'items'}
                          </p>
                        )}
                      </div>

                      {/* Order Footer & Actions */}
                      <div className="pt-3 border-t border-[#E5E5E5] flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-[#737373]">Total: </span>
                          <span className="font-extrabold text-sm text-[#141414]">
                            {formatCurrency(order.grandTotal)}
                          </span>
                          <span className="text-[11px] text-[#737373] ml-2">
                            via {order.paymentMethod.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <Link
                          href={`/account/orders/${order.orderNumber}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-semibold bg-[#141414] text-white hover:bg-[#424242] transition-colors"
                        >
                          <span>View Full Order Details</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </div>
          ) : (
            <div className="p-12 rounded-2xl border border-dashed border-[#D6D6D6] text-center space-y-3 bg-neutral-50/50">
              <Package className="w-8 h-8 text-[#737373] mx-auto" />
              <h3 className="font-semibold text-sm text-[#141414]">No order history found</h3>
              <p className="text-xs text-[#737373] max-w-sm mx-auto">
                When you place an order, full item snapshots, tracking numbers, and fulfillment receipts will be stored here.
              </p>
              <Button variant="primary" size="sm" onClick={() => router.push('/products')}>
                Explore Collections
              </Button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default function AccountOrdersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="container-storefront py-8 sm:py-12 flex-1 space-y-8">
        <React.Suspense
          fallback={
            <div className="py-20 flex-1 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
              <p className="text-xs text-[#737373]">Loading order history...</p>
            </div>
          }
        >
          <OrdersListContent />
        </React.Suspense>
      </main>
      <Footer />
    </div>
  );
}
