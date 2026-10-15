'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Package, 
  ArrowLeft, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Printer, 
  Loader2 
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function AccountOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/account/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
        } else if (res.status === 401) {
          router.push('/');
        } else {
          setError('Order not found or you do not have permission to view it.');
        }
      } catch (err) {
        console.error('Failed to load order:', err);
        setError('Connection error loading order details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrder();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading order details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-16 flex-1 space-y-6 max-w-xl mx-auto text-center">
          <Package className="w-12 h-12 text-[#737373] mx-auto" />
          <h1 className="text-xl font-bold text-[#141414]">Order Not Found</h1>
          <p className="text-xs text-[#737373]">{error || 'This order does not exist or belongs to another customer account.'}</p>
          <Button variant="primary" size="sm" onClick={() => router.push('/account/orders')}>
            Back to Orders
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';
  const isDelivered = order.fulfillmentStatus === 'DELIVERED';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 sm:py-12 flex-1 space-y-8">
        {/* Breadcrumb & Navigation */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li><Link href="/account" className="hover:underline">My Account</Link></li>
              <li>/</li>
              <li><Link href="/account/orders" className="hover:underline">Orders</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">#{order.orderNumber}</li>
            </ol>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-[#737373]">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <Link
              href="/account/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087443] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All Orders</span>
            </Link>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <section className="flex-1 w-full space-y-6">
            {/* Order Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="p-5 border border-[#E5E5E5] space-y-2 bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                  Payment Status
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={isPaid ? 'mint' : 'outline'} size="md">
                    {order.paymentStatus}
                  </Badge>
                  <span className="text-xs text-[#525252]">
                    via {order.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
              </Card>

              <Card className="p-5 border border-[#E5E5E5] space-y-2 bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#737373]">
                  Fulfillment Status
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={isDelivered ? 'mint' : 'neutral'} size="md">
                    {order.fulfillmentStatus}
                  </Badge>
                  <span className="text-xs text-[#525252]">
                    {order.shippingMethodName}
                  </span>
                </div>
              </Card>
            </div>

            {/* Real Tracking Info (RULE: Display tracking information only when valid tracking data exists) */}
            {order.trackingNumber ? (
              <Card className="p-5 border border-[#73E2A3] bg-[#D3F8DF]/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#087443]">
                  <Truck className="w-4 h-4" />
                  <span>Parcel Dispatched • Active Courier Tracking</span>
                </div>
                <div className="text-xs text-[#141414] space-y-0.5">
                  <p>Courier: <strong>{order.courierName}</strong></p>
                  <p>Tracking Airway Bill: <strong className="font-mono">{order.trackingNumber}</strong></p>
                </div>
              </Card>
            ) : null}

            {/* Purchased Items Table Snapshot */}
            <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden divide-y divide-[#E5E5E5]">
              <div className="p-4 bg-neutral-50/60 font-semibold text-xs text-[#141414]">
                Purchased Item Snapshots ({order.items.length})
              </div>

              {order.items.map((item: any) => (
                <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-[#141414] leading-snug">
                      {item.productTitle}
                    </h3>
                    <p className="text-[11px] text-[#737373]">
                      Variation: <span className="font-medium text-[#141414]">{item.variantTitle}</span>
                      <span className="ml-2 font-mono">SKU: {item.sku}</span>
                    </p>
                    <p className="text-[11px] text-[#525252]">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>

                  <span className="font-bold text-sm text-[#141414]">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}

              {/* Totals Breakdown */}
              <div className="p-5 bg-neutral-50/50 space-y-2 text-xs">
                <div className="flex justify-between text-[#525252]">
                  <span>Items Subtotal:</span>
                  <span className="font-semibold text-[#141414]">{formatCurrency(order.subtotal)}</span>
                </div>

                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-[#087443]">
                    <span>Promotional Discount:</span>
                    <span className="font-semibold">-{formatCurrency(order.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#525252]">
                  <span>Shipping:</span>
                  <span className="font-semibold text-[#141414]">
                    {order.shippingTotal === 0 ? 'FREE' : formatCurrency(order.shippingTotal)}
                  </span>
                </div>

                <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-baseline text-sm">
                  <span className="font-bold text-base text-[#141414]">Grand Total:</span>
                  <span className="font-extrabold text-xl text-[#141414]">
                    {formatCurrency(order.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination Snapshot */}
            <Card className="p-5 border border-[#E5E5E5] space-y-2 bg-white">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#737373]">
                Delivery Destination
              </h3>
              <div className="text-xs text-[#141414] space-y-0.5">
                <p className="font-bold">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="text-[#737373] pt-1">Contact: {order.shippingAddress.phone}</p>
              </div>
            </Card>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
