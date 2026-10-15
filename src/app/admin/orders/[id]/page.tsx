'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  MapPin,
  Send,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const orderId = params.id as string;

  const [order, setOrder] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Fulfillment update state
  const [fulfillmentStatus, setFulfillmentStatus] = React.useState('');
  const [trackingNumber, setTrackingNumber] = React.useState('');
  const [courierName, setCourierName] = React.useState('TCS Express');
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = React.useState(false);

  // Refund dialog state
  const [isRefundModalOpen, setIsRefundModalOpen] = React.useState(false);
  const [refundReason, setRefundReason] = React.useState('Customer requested cancellation and full refund');
  const [isProcessingRefund, setIsProcessingRefund] = React.useState(false);

  const loadOrder = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setFulfillmentStatus(data.order.fulfillmentStatus);
        setTrackingNumber(data.order.trackingNumber || '');
        setCourierName(data.order.courierName || 'TCS Express');
      } else {
        setErrorMessage('Order not found or administrative session expired.');
      }
    } catch {
      setErrorMessage('Network error fetching order details.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingFulfillment(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillmentStatus,
          tracking: trackingNumber.trim()
            ? { courier: courierName.trim(), trackingNumber: trackingNumber.trim() }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', title: 'Update Failed', message: data.error });
        return;
      }

      showToast({
        type: 'success',
        title: 'Fulfillment Updated',
        message: `Order transitioned to ${fulfillmentStatus}. Tracking records synchronized.`,
      });

      loadOrder();
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update order fulfillment.' });
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  const handleProcessRefund = async () => {
    setIsProcessingRefund(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'REFUNDED',
          refundReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', title: 'Refund Failed', message: data.error });
        return;
      }

      showToast({
        type: 'success',
        title: 'Order Refunded',
        message: 'Order marked as REFUNDED and financial ledger updated.',
      });

      setIsRefundModalOpen(false);
      loadOrder();
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to process refund.' });
    } finally {
      setIsProcessingRefund(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
        <p className="text-xs text-[#737373]">Loading order file...</p>
      </div>
    );
  }

  if (!order || errorMessage) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-[#141414]">Order Inspection Failed</h2>
        <p className="text-xs text-[#737373]">{errorMessage || 'Order not found.'}</p>
        <Link
          href="/admin/orders"
          className="inline-flex px-4 py-2 bg-[#141414] text-white rounded-lg text-xs font-semibold"
        >
          Return to Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';
  const isDelivered = order.fulfillmentStatus === 'DELIVERED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525252] hover:text-[#141414]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
        <span className="text-xs font-mono text-[#737373]">
          Placed on{' '}
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#141414]">
              Order #{order.orderNumber}
            </h1>
            <Badge variant={isPaid ? 'mint' : 'outline'} size="md">
              {order.paymentStatus}
            </Badge>
            <Badge variant={isDelivered ? 'mint' : 'neutral'} size="md">
              {order.fulfillmentStatus}
            </Badge>
          </div>
          <p className="text-xs text-[#737373] mt-1">
            Database Reference ID: <span className="font-mono">{order.id}</span>
          </p>
        </div>

        {order.paymentStatus !== 'REFUNDED' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRefundModalOpen(true)}
            className="text-xs text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Process Refund
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items Snapshots Table */}
          <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-3">
              Purchased Item Snapshots ({order.items.length})
            </h2>

            <div className="divide-y divide-[#E5E5E5]">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-[#141414]">
                      {item.productTitle}
                    </h3>
                    <p className="text-[11px] text-[#737373]">
                      Variation: <span className="font-medium text-[#141414]">{item.variantTitle}</span>
                      <span className="ml-2 font-mono">SKU: {item.sku}</span>
                    </p>
                    <p className="text-[11px] text-[#525252]">
                      {formatCurrency(item.unitPrice)} × {item.quantity} units
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-sm text-[#141414]">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-[#E5E5E5] space-y-1.5 text-xs">
              <div className="flex justify-between text-[#525252]">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-[#087443] font-medium">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-{formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#525252]">
                <span>Delivery Shipping Charges:</span>
                <span className="font-mono font-medium">{formatCurrency(order.shippingTotal)}</span>
              </div>
              <div className="flex justify-between text-[#141414] font-black text-sm pt-2 border-t border-[#E5E5E5]">
                <span>Grand Total:</span>
                <span className="font-mono">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          </Card>

          {/* Customer & Delivery Address Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737373]">
                <User className="w-4 h-4 text-[#141414]" />
                <span>Customer Contact</span>
              </div>
              <div className="text-xs space-y-1 text-[#141414]">
                <p className="font-semibold text-sm">{order.user?.name || order.shippingAddress.recipientName}</p>
                <p className="text-[#525252]">{order.customerEmail}</p>
                <p className="font-mono text-[#525252]">{order.customerPhone}</p>
              </div>
            </Card>

            <Card className="p-5 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#737373]">
                <MapPin className="w-4 h-4 text-[#141414]" />
                <span>Delivery Destination</span>
              </div>
              <div className="text-xs space-y-0.5 text-[#525252]">
                <p className="font-semibold text-[#141414]">{order.shippingAddress.recipientName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column (Fulfillment & Tracking Controls) */}
        <div className="space-y-6">
          <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-5">
            <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-3">
              Fulfillment & Courier Dispatch
            </h2>

            <form onSubmit={handleUpdateFulfillment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#141414]">
                  Fulfillment Status
                </label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
                >
                  <option value="UNFULFILLED">UNFULFILLED</option>
                  <option value="PROCESSING">PROCESSING (Packing in warehouse)</option>
                  <option value="SHIPPED">SHIPPED (Handed to courier)</option>
                  <option value="DELIVERED">DELIVERED (Customer received)</option>
                  <option value="CANCELLED">CANCELLED (Restock inventory)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#141414]">
                  Courier Service Provider
                </label>
                <Input
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. TCS Express, Leopards, DHL"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#141414]">
                  Tracking Airway Bill (AWB) #
                </label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TCS-9982410291"
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-[#737373]">
                  Saving tracking details automatically displays active tracking in the customer&apos;s account portal.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isUpdatingFulfillment}
                className="w-full bg-[#141414] hover:bg-[#333333] text-white font-bold text-xs"
              >
                {isUpdatingFulfillment ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing...</span>
                  </span>
                ) : (
                  <span>Update Order Fulfillment</span>
                )}
              </Button>
            </form>
          </Card>

          {/* Payment Snapshot */}
          <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-3">
            <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-2">
              Payment Gateway Snapshot
            </h2>
            <div className="text-xs space-y-1.5 text-[#525252]">
              <div className="flex justify-between">
                <span>Method:</span>
                <strong className="text-[#141414]">{order.paymentMethod.replace(/_/g, ' ')}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Status:</span>
                <strong className="text-[#141414]">{order.paymentStatus}</strong>
              </div>
              <div className="flex justify-between">
                <span>Settled Amount:</span>
                <strong className="text-[#141414]">{formatCurrency(order.grandTotal)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Refund Modal */}
      {isRefundModalOpen && (
        <Dialog
          isOpen={isRefundModalOpen}
          onClose={() => setIsRefundModalOpen(false)}
          title={`Process Full Refund: Order #${order.orderNumber}`}
          description="Enforces financial record updates and returns purchased inventory back to stock."
        >
          <div className="space-y-4 pt-2">
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
              <p className="font-semibold">Refund Action Confirmation:</p>
              <p className="text-[11px]">
                Refunding this order for <strong>{formatCurrency(order.grandTotal)}</strong> will mark payment status as REFUNDED,
                log a cancellation payment entry, and restock all variant inventory items.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Administrative Reason for Refund
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full text-xs rounded-lg border border-[#D6D6D6] p-2.5 text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRefundModalOpen(false)}
                disabled={isProcessingRefund}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleProcessRefund}
                disabled={isProcessingRefund}
              >
                {isProcessingRefund ? 'Processing...' : 'Confirm and Authorize Refund'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
