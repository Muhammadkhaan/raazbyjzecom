'use client';

import * as React from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  Percent,
  DollarSign,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // New Coupon Modal State
  const [isNewModalOpen, setIsNewModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const [code, setCode] = React.useState('');
  const [discountType, setDiscountType] = React.useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = React.useState('');
  const [minOrderValue, setMinOrderValue] = React.useState('');
  const [maxUses, setMaxUses] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState('');

  const loadCoupons = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) {
      setFormError('Discount value must be a positive number.');
      setIsSubmitting(false);
      return;
    }

    if (discountType === 'PERCENTAGE' && val > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discountValue: val,
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
          maxUses: maxUses ? parseInt(maxUses, 10) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create coupon.');
        setIsSubmitting(false);
        return;
      }

      showToast({
        type: 'success',
        title: 'Coupon Created',
        message: `Promotion code "${data.coupon.code}" is now active.`,
      });

      setIsNewModalOpen(false);
      setCode('');
      setDiscountValue('');
      setMinOrderValue('');
      setMaxUses('');
      setExpiresAt('');
      loadCoupons();
    } catch {
      setFormError('Connection error creating promotional discount.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: any) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Coupon Updated',
          message: `Coupon ${coupon.code} is now ${!coupon.isActive ? 'Active' : 'Inactive'}.`,
        });
        loadCoupons();
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update coupon status.' });
    }
  };

  const handleDeleteCoupon = async (coupon: any) => {
    if (!confirm(`Are you sure you want to remove promotion "${coupon.code}"?`)) return;

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast({
          type: 'success',
          title: data.action === 'DEACTIVATED' ? 'Coupon Deactivated' : 'Coupon Deleted',
          message: data.message,
        });
        loadCoupons();
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to remove coupon.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Create CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Promotions & Coupon Codes ({coupons.length})
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Configure discount vouchers, usage caps, order thresholds, and expiry schedules.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsNewModalOpen(true)}
          className="bg-[#141414] hover:bg-[#333333] text-white font-bold text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5 text-[#73E2A3]" />
          <span>Create Coupon Code</span>
        </Button>
      </div>

      {/* Coupons Table */}
      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
            <p className="text-xs text-[#737373]">Loading promotional coupons...</p>
          </div>
        ) : coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Min Order Threshold</th>
                  <th className="py-3 px-4">Usage Count / Cap</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Code */}
                    <td className="py-3 px-4">
                      <div className="font-mono font-black text-sm text-[#141414]">
                        {coupon.code}
                      </div>
                    </td>

                    {/* Discount Value */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-[#087443]">
                        {coupon.discountType === 'PERCENTAGE'
                          ? `${coupon.discountValue}% OFF`
                          : `${formatCurrency(coupon.discountValue)} OFF`}
                      </span>
                    </td>

                    {/* Min Order Value */}
                    <td className="py-3 px-4 text-[#525252]">
                      {coupon.minOrderValue ? formatCurrency(coupon.minOrderValue) : 'No Minimum'}
                    </td>

                    {/* Usage */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#141414]">
                        {coupon.usedCount} used
                      </span>
                      {coupon.maxUses && (
                        <span className="text-[#737373] text-[11px] ml-1">
                          / {coupon.maxUses} max
                        </span>
                      )}
                    </td>

                    {/* Validity Expiry */}
                    <td className="py-3 px-4 text-[#737373]">
                      {coupon.expiresAt ? (
                        <span>
                          Expires{' '}
                          {new Date(coupon.expiresAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-[#087443] font-medium">Never Expires</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge variant={coupon.isActive ? 'mint' : 'outline'} size="sm">
                        {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(coupon)}
                          className="px-2.5 py-1 rounded-lg border border-[#D6D6D6] text-[11px] font-semibold hover:bg-neutral-100"
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="Remove Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Ticket className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h3 className="font-semibold text-sm text-[#141414]">No promotion coupons configured</h3>
            <p className="text-xs text-[#737373]">
              Create promotional discount vouchers for customer campaigns and marketing emails.
            </p>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isNewModalOpen && (
        <Dialog
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="Create Promotional Discount Coupon"
          description="Enforce discount limits, order thresholds, and expiration schedules."
        >
          <form onSubmit={handleCreateCoupon} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#141414]">Coupon Code</label>
                <Input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FESTIVE15"
                  className="text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#141414]">Discount Type</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (PKR)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#141414]">
                  Discount Value {discountType === 'PERCENTAGE' ? '(%)' : '(PKR)'}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 1000'}
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#141414]">
                  Min Order Value (PKR, Optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="e.g. 5000"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#141414]">
                  Maximum Total Uses (Optional)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="e.g. 100"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#141414]">
                  Expiration Date (Optional)
                </label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#087443] hover:bg-[#065F38] text-white font-bold"
              >
                {isSubmitting ? 'Creating...' : 'Activate Coupon'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}
