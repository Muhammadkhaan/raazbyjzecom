'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Boxes,
  Search,
  Filter,
  History,
  AlertTriangle,
  ArrowUpDown,
  Plus,
  Minus,
  CheckCircle2,
  Package,
  Loader2,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/catalog/pagination';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

function AdminInventoryList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [lowStockOnly, setLowStockOnly] = React.useState(
    searchParams.get('lowStockOnly') === 'true'
  );

  const [variants, setVariants] = React.useState<any[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // Stock Adjustment Modal State
  const [adjustingVariant, setAdjustingVariant] = React.useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = React.useState('');
  const [adjustReason, setAdjustReason] = React.useState('RESTOCK');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = React.useState(false);

  // Variant History Modal State
  const [historyVariant, setHistoryVariant] = React.useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = React.useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadInventory = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(currentPage));
      q.set('pageSize', '15');
      if (debouncedSearch) q.set('search', debouncedSearch);
      if (lowStockOnly) q.set('lowStockOnly', 'true');

      const res = await fetch(`/api/admin/inventory?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, lowStockOnly]);

  React.useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleOpenAdjust = (variant: any) => {
    setAdjustingVariant(variant);
    setAdjustAmount('');
    setAdjustReason('RESTOCK');
  };

  const handleOpenHistory = async (variant: any) => {
    setHistoryVariant(variant);
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`/api/admin/inventory/${variant.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryLogs(data.history || []);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingVariant) return;

    const diff = parseInt(adjustAmount, 10);
    if (isNaN(diff) || diff === 0) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Stock adjustment must be a positive number for restock or negative for deduction.',
      });
      return;
    }

    if (adjustingVariant.inventoryCount + diff < 0) {
      showToast({
        type: 'error',
        title: 'Negative Balance Prohibited',
        message: `Cannot reduce below 0. Current stock is ${adjustingVariant.inventoryCount}.`,
      });
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: adjustingVariant.id,
          changeAmount: diff,
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({ type: 'error', title: 'Adjustment Failed', message: data.error });
        return;
      }

      showToast({
        type: 'success',
        title: 'Stock Updated',
        message: `New balance for SKU ${adjustingVariant.sku}: ${data.variant.inventoryCount} units.`,
      });

      setAdjustingVariant(null);
      loadInventory();
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to adjust stock.' });
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Stock & Inventory Control ({totalCount})
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Real-time tracking, ledger history, safe restocking transactions, and low-inventory alarms.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, variant title, or product..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#141414]">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Low Stock Only (≤ 5)</span>
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
            <p className="text-xs text-[#737373]">Loading inventory balances...</p>
          </div>
        ) : variants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="py-3 px-4">Variant & Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Size / Color</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Unit Price</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {variants.map((variant) => {
                  const isLow = variant.inventoryCount <= 5;
                  const isOut = variant.inventoryCount === 0;

                  return (
                    <tr key={variant.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Product Thumbnail & Variant */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 relative bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-[#E5E5E5]">
                            {variant.imageUrl ? (
                              <Image
                                src={variant.imageUrl}
                                alt={variant.productTitle}
                                fill
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#737373]">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${variant.productId}`}
                              className="font-bold text-sm text-[#141414] hover:text-[#087443] hover:underline"
                            >
                              {variant.productTitle}
                            </Link>
                            <p className="text-[11px] text-[#737373]">
                              {variant.title}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono font-bold text-[#141414]">
                        {variant.sku}
                      </td>

                      {/* Attributes */}
                      <td className="py-3 px-4 text-[#525252]">
                        {variant.size || '—'} / {variant.color || '—'}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-[#D3F8DF] text-[#087443]'
                            }`}
                          >
                            {variant.inventoryCount} units
                          </span>
                          {isOut ? (
                            <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider">
                              Low Stock
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-extrabold text-[#141414]">
                        {formatCurrency(variant.price)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenAdjust(variant)}
                            className="h-8 px-2.5 text-xs bg-[#141414] hover:bg-[#333333] text-white"
                          >
                            <span>Adjust Stock</span>
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleOpenHistory(variant)}
                            title="View Ledger Audit History"
                            className="p-1.5 rounded-lg border border-[#D6D6D6] text-[#525252] hover:bg-neutral-100"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Boxes className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h3 className="font-semibold text-sm text-[#141414]">No inventory items found</h3>
            <p className="text-xs text-[#737373]">
              No product variants matched the filter criteria.
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

      {/* Adjust Stock Modal */}
      {adjustingVariant && (
        <Dialog
          isOpen={Boolean(adjustingVariant)}
          onClose={() => setAdjustingVariant(null)}
          title={`Adjust Inventory: ${adjustingVariant.sku}`}
          description={`Update stock for "${adjustingVariant.productTitle}" (${adjustingVariant.title}).`}
        >
          <form onSubmit={handleConfirmAdjust} className="space-y-4 pt-2">
            <div className="p-3 bg-neutral-100 rounded-xl flex items-center justify-between text-xs">
              <span className="text-[#737373]">Authoritative Database Balance:</span>
              <span className="font-mono font-bold text-sm text-[#141414]">
                {adjustingVariant.inventoryCount} units
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Change Quantity (+ for restock, - for deduction)
              </label>
              <Input
                type="number"
                required
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="e.g. 25 or -3"
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-[#737373]">
                Projected New Balance:{' '}
                <strong className="font-mono text-[#141414]">
                  {adjustingVariant.inventoryCount + (parseInt(adjustAmount || '0', 10) || 0)} units
                </strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Adjustment Reason (Recorded in Immutable Ledger)
              </label>
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
              >
                <option value="RESTOCK">Factory / Artisan Restock</option>
                <option value="MANUAL_ADJUSTMENT">Manual Stock Count Reconciliation</option>
                <option value="DAMAGED_INVENTORY">Damaged / Defective Stock Write-off</option>
                <option value="RETURN">Customer Return / Exchange</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAdjustingVariant(null)}
                disabled={isSubmittingAdjust}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingAdjust}
                className="bg-[#087443] hover:bg-[#065F38] text-white font-bold"
              >
                {isSubmittingAdjust ? 'Committing...' : 'Commit Stock Transaction'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Stock History Audit Ledger Modal */}
      {historyVariant && (
        <Dialog
          isOpen={Boolean(historyVariant)}
          onClose={() => setHistoryVariant(null)}
          title={`Inventory Audit Ledger: ${historyVariant.sku}`}
          description={`Full immutable transaction log for "${historyVariant.title}".`}
        >
          <div className="space-y-4 pt-2">
            {isLoadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#087443]" />
                <p className="text-xs text-[#737373]">Querying inventory transactions...</p>
              </div>
            ) : historyLogs.length > 0 ? (
              <div className="border border-[#E5E5E5] rounded-xl overflow-hidden divide-y divide-[#E5E5E5] max-h-96 overflow-y-auto">
                {historyLogs.map((log) => (
                  <div key={log.id} className="p-3 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#141414]">{log.reason}</div>
                      <div className="text-[10px] text-[#737373]">
                        {new Date(log.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        • Balance: <strong className="font-mono">{log.newBalance}</strong>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        log.changeAmount > 0
                          ? 'bg-[#D3F8DF] text-[#087443]'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#737373] text-center py-6">
                No inventory adjustment logs recorded for this variant yet.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryVariant(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading inventory...</p>
        </div>
      }
    >
      <AdminInventoryList />
    </React.Suspense>
  );
}
