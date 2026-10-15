'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/catalog/pagination';
import { formatCurrency } from '@/lib/utils';

function AdminOrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [fulfillmentStatus, setFulfillmentStatus] = React.useState(
    searchParams.get('fulfillmentStatus') || 'ALL'
  );
  const [paymentStatus, setPaymentStatus] = React.useState(
    searchParams.get('paymentStatus') || 'ALL'
  );

  const [orders, setOrders] = React.useState<any[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(currentPage));
      q.set('pageSize', '10');
      if (debouncedSearch) q.set('search', debouncedSearch);
      if (fulfillmentStatus !== 'ALL') q.set('fulfillmentStatus', fulfillmentStatus);
      if (paymentStatus !== 'ALL') q.set('paymentStatus', paymentStatus);

      const res = await fetch(`/api/admin/orders?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, fulfillmentStatus, paymentStatus]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Order Management & Fulfillment ({totalCount})
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Search orders, inspect customer shipping details, dispatch tracking codes, and process refunds.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, email, or phone..."
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={fulfillmentStatus}
            onChange={(e) => setFulfillmentStatus(e.target.value)}
            className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
          >
            <option value="ALL">All Fulfillment Statuses</option>
            <option value="UNFULFILLED">Unfulfilled</option>
            <option value="PROCESSING">Processing / Packing</option>
            <option value="SHIPPED">Dispatched / Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PENDING">Pending Payment</option>
            <option value="PAID">Paid / Settled</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
            <p className="text-xs text-[#737373]">Querying orders database...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {orders.map((order) => {
                  const isPaid = order.paymentStatus === 'PAID';
                  const isDelivered = order.fulfillmentStatus === 'DELIVERED';

                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-mono font-bold text-sm text-[#141414] hover:text-[#087443] hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                        <p className="text-[10px] text-[#737373]">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#141414]">
                          {order.customerName}
                        </div>
                        <p className="text-[11px] text-[#737373]">{order.customerEmail}</p>
                        <p className="text-[10px] font-mono text-[#737373]">{order.customerPhone}</p>
                      </td>

                      {/* Items */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-[#141414]">
                          {order.itemCount} items
                        </span>
                        <p className="text-[11px] text-[#737373] truncate" title={order.itemsSummary}>
                          {order.itemsSummary}
                        </p>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4">
                        <Badge variant={isPaid ? 'mint' : 'outline'} size="sm">
                          {order.paymentStatus}
                        </Badge>
                        <p className="text-[10px] text-[#737373] mt-0.5">
                          {order.paymentMethod.replace(/_/g, ' ')}
                        </p>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3 px-4">
                        <Badge variant={isDelivered ? 'mint' : 'neutral'} size="sm">
                          {order.fulfillmentStatus}
                        </Badge>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 font-black text-sm text-[#141414]">
                        {formatCurrency(order.grandTotal)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D6D6D6] font-semibold text-xs text-[#141414] hover:bg-neutral-100 transition-colors"
                        >
                          <span>Manage</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <ClipboardList className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h3 className="font-semibold text-sm text-[#141414]">No orders match this filter</h3>
            <p className="text-xs text-[#737373]">
              Try adjusting your search criteria or resetting status filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E5E5]">
            <Pagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading orders...</p>
        </div>
      }
    >
      <AdminOrdersList />
    </React.Suspense>
  );
}
