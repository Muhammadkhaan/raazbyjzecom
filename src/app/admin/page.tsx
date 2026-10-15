'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Package,
  Boxes,
  Users,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  ShoppingBag,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [preset, setPreset] = React.useState<'all' | 'today' | '7days' | '30days'>('all');
  const [data, setData] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMetrics = React.useCallback(async (selectedPreset: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/metrics?preset=${selectedPreset}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to load metrics from server.');
      }
    } catch {
      setError('Connection failure loading dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMetrics(preset);
  }, [preset, fetchMetrics]);

  return (
    <div className="space-y-8">
      {/* Title & Preset Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Storefront Overview & Metrics
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Real-time, database-backed sales performance, inventory balances, and order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-[#D6D6D6] rounded-xl p-1 flex items-center shadow-2xs">
            {(['all', '30days', '7days', 'today'] as const).map((p) => {
              const labels = {
                all: 'All Time',
                '30days': '30 Days',
                '7days': '7 Days',
                today: 'Today',
              };
              const isSelected = preset === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[#141414] text-white shadow-2xs'
                      : 'text-[#525252] hover:text-[#141414] hover:bg-neutral-100'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(preset)}
            className="h-9 px-3"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Sales */}
        <Card className="p-5 border border-[#E5E5E5] bg-white rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Gross Sales (Paid)
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#D3F8DF] text-[#087443] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#141414]">
              {data ? formatCurrency(data.metrics.totalGrossSales) : '—'}
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Across {data ? data.metrics.paidOrdersCount : 0} settled orders
            </p>
          </div>
        </Card>

        {/* Total Orders */}
        <Card className="p-5 border border-[#E5E5E5] bg-white rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#141414]">
              {data ? data.metrics.totalOrdersCount : '—'}
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5">
              {data ? data.metrics.pendingOrdersCount : 0} unfulfilled • {data ? data.metrics.cancelledOrdersCount : 0} cancelled
            </p>
          </div>
        </Card>

        {/* Average Order Value (AOV) */}
        <Card className="p-5 border border-[#E5E5E5] bg-white rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-neutral-100 text-[#141414] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#141414]">
              {data ? formatCurrency(data.metrics.averageOrderValue) : '—'}
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5">
              Net average revenue per settled cart
            </p>
          </div>
        </Card>

        {/* Total Refunds */}
        <Card className="p-5 border border-[#E5E5E5] bg-white rounded-2xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Processed Refunds
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#141414]">
              {data ? formatCurrency(data.metrics.totalRefundAmount) : '—'}
            </div>
            <p className="text-[11px] text-[#737373] mt-0.5">
              {data ? data.metrics.refundedOrdersCount : 0} returned orders refunded
            </p>
          </div>
        </Card>
      </div>

      {/* Secondary Counter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#141414]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[#737373]">Total Catalog Products</p>
              <p className="text-lg font-extrabold text-[#141414]">{data?.metrics.totalProducts ?? 0}</p>
            </div>
          </div>
          <Link href="/admin/products" className="text-xs font-semibold text-[#087443] hover:underline">
            Manage Catalog →
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-[#141414]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[#737373]">Registered Customers</p>
              <p className="text-lg font-extrabold text-[#141414]">{data?.metrics.totalCustomers ?? 0}</p>
            </div>
          </div>
          <Link href="/admin/customers" className="text-xs font-semibold text-[#087443] hover:underline">
            View Accounts →
          </Link>
        </div>

        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-[#737373]">Low Stock Items (≤ 5)</p>
              <p className="text-lg font-extrabold text-[#141414]">{data?.metrics.lowStockCount ?? 0}</p>
            </div>
          </div>
          <Link href="/admin/inventory?lowStockOnly=true" className="text-xs font-semibold text-amber-700 hover:underline">
            Restock Now →
          </Link>
        </div>
      </div>

      {/* Recent Orders & Low Stock Alert Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#141414]">
              Recent Orders ({data?.recentOrders?.length ?? 0})
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-[#087443] hover:underline inline-flex items-center gap-1"
            >
              <span>All Orders</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="divide-y divide-[#E5E5E5]">
                {data.recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-neutral-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-mono font-bold text-sm text-[#141414] hover:text-[#087443] hover:underline"
                        >
                          #{order.orderNumber}
                        </Link>
                        <Badge
                          variant={order.paymentStatus === 'PAID' ? 'mint' : 'outline'}
                          size="sm"
                        >
                          {order.paymentStatus}
                        </Badge>
                        <Badge
                          variant={order.fulfillmentStatus === 'DELIVERED' ? 'mint' : 'neutral'}
                          size="sm"
                        >
                          {order.fulfillmentStatus}
                        </Badge>
                      </div>
                      <p className="text-[#737373]">
                        {order.customerEmail} • {order.itemCount} items
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="font-extrabold text-sm text-[#141414]">
                          {formatCurrency(order.grandTotal)}
                        </div>
                        <span className="text-[10px] text-[#737373]">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="px-3 py-1.5 rounded-lg border border-[#D6D6D6] hover:bg-neutral-100 font-semibold text-xs text-[#141414]"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <Package className="w-8 h-8 text-[#A3A3A3] mx-auto" />
                <p className="text-xs text-[#737373]">No orders recorded for this filter window.</p>
              </div>
            )}
          </div>
        </div>

        {/* Low-Stock Attention Items (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#141414] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Low-Stock Inventory</span>
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-[#087443] hover:underline"
            >
              Full Inventory →
            </Link>
          </div>

          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs divide-y divide-[#E5E5E5]">
            {data?.lowStockAlerts && data.lowStockAlerts.length > 0 ? (
              data.lowStockAlerts.map((alert: any) => (
                <div key={alert.id} className="p-3.5 space-y-1.5 text-xs hover:bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#141414] truncate max-w-[180px]">
                      {alert.productTitle}
                    </span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        alert.inventoryCount === 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {alert.inventoryCount === 0 ? 'SOLD OUT' : `${alert.inventoryCount} left`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#737373]">
                    <span>
                      {alert.title} • <strong className="font-mono">{alert.sku}</strong>
                    </span>
                    <Link
                      href={`/admin/inventory?search=${encodeURIComponent(alert.sku)}`}
                      className="text-[#087443] font-semibold hover:underline"
                    >
                      Restock
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-[#087443] mx-auto" />
                <p className="text-xs text-[#737373]">All variant stock counts are above minimum thresholds.</p>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="p-5 rounded-2xl bg-[#141414] text-white space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#A3A3A3]">
              Quick Admin Actions
            </h3>
            <div className="space-y-2">
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-xs font-semibold text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#73E2A3]" />
                  <span>Publish New Product</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
              </Link>

              <Link
                href="/admin/coupons"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-xs font-semibold text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#73E2A3]" />
                  <span>Create Discount Coupon</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#262626] hover:bg-[#333333] text-xs font-semibold text-white transition-colors"
              >
                <span>Store & Shipping Settings</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#737373]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
