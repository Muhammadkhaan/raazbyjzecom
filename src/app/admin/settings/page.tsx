'use client';

import * as React from 'react';
import {
  Settings,
  Store,
  CreditCard,
  Truck,
  Percent,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Store General Settings
  const [storeName, setStoreName] = React.useState('Laam Studio');
  const [storeEmail, setStoreEmail] = React.useState('support@laamstore.com');
  const [storePhone, setStorePhone] = React.useState('+92 42 111 522 678');
  const [storeAddress, setStoreAddress] = React.useState('Gulberg III, MM Alam Road, Lahore, Pakistan');
  const [currency, setCurrency] = React.useState('PKR');
  const [taxRate, setTaxRate] = React.useState('0');
  const [lowStockThreshold, setLowStockThreshold] = React.useState('5');

  // Payment Gateways
  const [paymentCod, setPaymentCod] = React.useState(true);
  const [paymentStripe, setPaymentStripe] = React.useState(false);
  const [paymentBank, setPaymentBank] = React.useState(false);

  // Shipping Methods
  const [shippingMethods, setShippingMethods] = React.useState<
    { id?: string; name: string; code: string; rate: number; estimatedDays: string; isActive: boolean }[]
  >([]);

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          setStoreName(s.storeName || 'Laam Studio');
          setStoreEmail(s.storeEmail || 'support@laamstore.com');
          setStorePhone(s.storePhone || '+92 42 111 522 678');
          setStoreAddress(s.storeAddress || 'Gulberg III, MM Alam Road, Lahore, Pakistan');
          setCurrency(s.currency || 'PKR');
          setTaxRate(String(s.taxRate ?? 0));
          setLowStockThreshold(String(s.lowStockThreshold ?? 5));
          setPaymentCod(Boolean(s.paymentCodEnabled));
          setPaymentStripe(Boolean(s.paymentStripeEnabled));
          setPaymentBank(Boolean(s.paymentBankEnabled));
          setShippingMethods(s.shippingMethods || []);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        settings: {
          store_name: storeName.trim(),
          store_email: storeEmail.trim(),
          store_phone: storePhone.trim(),
          store_address: storeAddress.trim(),
          store_currency: currency.trim(),
          tax_rate: String(parseFloat(taxRate) || 0),
          low_stock_threshold: String(parseInt(lowStockThreshold, 10) || 5),
          payment_cod_enabled: String(paymentCod),
          payment_stripe_enabled: String(paymentStripe),
          payment_bank_enabled: String(paymentBank),
        },
        shippingMethods,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Settings Saved',
          message: 'Store configurations and shipping rates updated in database.',
        });
      } else {
        const err = await res.json();
        showToast({ type: 'error', title: 'Save Failed', message: err.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Connection error persisting settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
        <p className="text-xs text-[#737373]">Loading store configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Storefront Settings & Policies
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Configure identity, payment methods, delivery courier rates, and inventory thresholds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Store Identity */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <Store className="w-4 h-4 text-[#141414]" />
            <h2 className="text-sm font-bold text-[#141414]">Store Brand & Identity</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Storefront Name</label>
              <Input
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Primary Support Email</label>
              <Input
                type="email"
                required
                value={storeEmail}
                onChange={(e) => setStoreEmail(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Support Phone</label>
              <Input
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Operating Currency</label>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="text-xs font-mono uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Low Stock Threshold Alert
              </label>
              <Input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141414]">Physical Headquarters Address</label>
            <Input
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="text-xs"
            />
          </div>
        </Card>

        {/* Payment Gateways Configuration */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <CreditCard className="w-4 h-4 text-[#141414]" />
            <h2 className="text-sm font-bold text-[#141414]">Authoritative Payment Gateways</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#141414]">Cash on Delivery (COD)</span>
                <p className="text-[11px] text-[#737373]">
                  Permit customers nationwide to pay upon parcel doorstep fulfillment.
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentCod}
                onChange={(e) => setPaymentCod(e.target.checked)}
                className="w-4 h-4 rounded text-[#087443] focus:ring-[#087443]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#141414]">Direct Bank Transfer</span>
                <p className="text-[11px] text-[#737373]">
                  Accept manual IBAN wire transfers with administrative payment verification.
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentBank}
                onChange={(e) => setPaymentBank(e.target.checked)}
                className="w-4 h-4 rounded text-[#087443] focus:ring-[#087443]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#141414]">Stripe / Card Gateway Adapter</span>
                <p className="text-[11px] text-[#737373]">
                  Accept Visa, MasterCard, and international card payments via official gateway.
                </p>
              </div>
              <input
                type="checkbox"
                checked={paymentStripe}
                onChange={(e) => setPaymentStripe(e.target.checked)}
                className="w-4 h-4 rounded text-[#087443] focus:ring-[#087443]"
              />
            </label>
          </div>
        </Card>

        {/* Shipping Methods Configuration */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#141414]" />
              <h2 className="text-sm font-bold text-[#141414]">Shipping Courier Methods & Rates</h2>
            </div>
          </div>

          <div className="space-y-3">
            {shippingMethods.map((sm, idx) => (
              <div
                key={sm.id || idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-3 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 items-center text-xs"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#737373]">Method Name</label>
                  <Input
                    value={sm.name}
                    onChange={(e) => {
                      const updated = [...shippingMethods];
                      updated[idx].name = e.target.value;
                      setShippingMethods(updated);
                    }}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#737373]">Code</label>
                  <Input
                    value={sm.code}
                    disabled
                    className="text-xs font-mono uppercase bg-neutral-200/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#737373]">Flat Fee (PKR)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sm.rate}
                    onChange={(e) => {
                      const updated = [...shippingMethods];
                      updated[idx].rate = parseFloat(e.target.value) || 0;
                      setShippingMethods(updated);
                    }}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[#737373]">Estimated Transit</label>
                  <Input
                    value={sm.estimatedDays}
                    onChange={(e) => {
                      const updated = [...shippingMethods];
                      updated[idx].estimatedDays = e.target.value;
                      setShippingMethods(updated);
                    }}
                    className="text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Save */}
        <div className="flex justify-end pt-4 border-t border-[#E5E5E5]">
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="bg-[#087443] hover:bg-[#065F38] text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Configurations...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Store Settings</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
