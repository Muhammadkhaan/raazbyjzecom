import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderConfirmation } from '@/lib/checkout/checkout-service';
import { getCurrentUser } from '@/lib/auth/session';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, PackageCheck, Truck, ShieldCheck, ArrowRight, Printer } from 'lucide-react';

interface ConfirmationPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: ConfirmationPageProps) {
  const { orderNumber } = await params;
  return {
    title: `Order Confirmed: #${orderNumber} | Laam Studio`,
    description: `Official order confirmation and receipt for order #${orderNumber}.`,
  };
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();

  const order = await getOrderConfirmation(orderNumber, user?.id);

  if (!order) {
    notFound();
  }

  const isPaid = order.paymentStatus === 'PAID';
  const isCOD = order.paymentMethod === 'CASH_ON_DELIVERY';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-10 sm:py-16 flex-1 space-y-10 max-w-4xl mx-auto">
        {/* Success Hero Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#D3F8DF] border-2 border-[#73E2A3] flex items-center justify-center text-[#087443] mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-semibold uppercase tracking-widest text-[#087443]">
            Thank You For Your Order
          </span>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141414]">
            Order #{order.orderNumber} Confirmed
          </h1>

          <p className="text-xs sm:text-sm text-[#525252] max-w-lg mx-auto leading-relaxed">
            A confirmation receipt has been dispatched to{' '}
            <strong className="text-[#141414] font-semibold">{order.customerEmail}</strong>.
            Our team will begin preparing your designer ensemble.
          </p>
        </div>

        {/* Status Callout Card */}
        <Card className="p-6 border border-[#E5E5E5] bg-neutral-50/70 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
            <div>
              <span className="text-[11px] text-[#737373] block uppercase tracking-wider">
                Order Reference
              </span>
              <span className="font-mono font-bold text-base text-[#141414]">
                {order.orderNumber}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#737373] block uppercase tracking-wider">
                Placed On
              </span>
              <span className="text-xs font-semibold text-[#141414]">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#737373] block uppercase tracking-wider">
                Payment Status
              </span>
              <Badge variant={isPaid ? 'mint' : 'outline'} size="md">
                {isPaid ? 'PAID' : isCOD ? 'CASH ON DELIVERY (PENDING)' : order.paymentStatus}
              </Badge>
            </div>

            <div>
              <span className="text-[11px] text-[#737373] block uppercase tracking-wider">
                Fulfillment Status
              </span>
              <Badge variant="neutral" size="md">
                {order.fulfillmentStatus}
              </Badge>
            </div>
          </div>

          {/* Payment Instructions */}
          {isCOD && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
              <span className="font-semibold block">Doorstep Payment Instructions:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Please have exact cash of{' '}
                <strong className="font-bold">{formatCurrency(order.grandTotal)}</strong> ready
                at the time of delivery. The courier representative will collect cash and hand over your verified package.
              </p>
            </div>
          )}
        </Card>

        {/* Purchased Items Table Snapshot */}
        <section className="space-y-4">
          <h2 className="font-heading font-bold text-lg text-[#141414]">
            Purchased Designs ({order.items.length})
          </h2>

          <div className="border border-[#E5E5E5] rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-[#E5E5E5]">
            {order.items.map((item) => (
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

                <div className="text-right">
                  <span className="font-bold text-sm text-[#141414]">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              </div>
            ))}

            {/* Financial Breakdown */}
            <div className="p-5 bg-neutral-50/50 space-y-2 text-xs">
              <div className="flex justify-between text-[#525252]">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-[#141414]">{formatCurrency(order.subtotal)}</span>
              </div>

              {order.discountTotal > 0 && (
                <div className="flex justify-between text-[#087443]">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#525252]">
                <span>Shipping ({order.shippingMethodName}):</span>
                <span className="font-semibold text-[#141414]">
                  {order.shippingTotal === 0 ? 'FREE' : formatCurrency(order.shippingTotal)}
                </span>
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-baseline text-sm">
                <span className="font-bold text-base text-[#141414]">Amount To Pay:</span>
                <span className="font-extrabold text-xl text-[#141414]">
                  {formatCurrency(order.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Destination Snapshot */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="p-5 border border-[#E5E5E5] space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#737373]">
              Delivery Destination
            </h3>
            <div className="text-xs text-[#141414] space-y-1">
              <p className="font-bold text-sm">{order.shippingAddress.recipientName}</p>
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="text-[#737373] pt-1">Phone: {order.shippingAddress.phone}</p>
            </div>
          </Card>

          <Card className="p-5 border border-[#E5E5E5] space-y-2 flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#737373]">
                Order Next Steps
              </h3>
              <ul className="text-xs text-[#525252] space-y-1.5 list-disc pl-4">
                <li>Quality check & hand packaging at Lahore fulfillment center.</li>
                <li>Tracking number issued once parcel is dispatched.</li>
                <li>Delivery within estimated business days.</li>
              </ul>
            </div>

            <div className="pt-3">
              <Link
                href="/products"
                className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#141414] text-white hover:bg-[#424242] transition-colors"
              >
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
