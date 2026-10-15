'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Banknote, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useToast } from '@/components/ui/toast';
import { formatCurrency } from '@/lib/utils';
import type { OrderCalculationResult } from '@/lib/checkout/checkout-service';

export default function CheckoutPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Checkout Form State
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [street, setStreet] = React.useState('');
  const [city, setCity] = React.useState('Karachi');
  const [postalCode, setPostalCode] = React.useState('75500');
  const [country, setCountry] = React.useState('Pakistan');
  const [shippingMethod, setShippingMethod] = React.useState('STANDARD');
  const [paymentMethod, setPaymentMethod] = React.useState('CASH_ON_DELIVERY');
  const [couponCode, setCouponCode] = React.useState('');
  const [notes, setNotes] = React.useState('');

  // Config & Calculation State
  const [shippingMethods, setShippingMethods] = React.useState<any[]>([]);
  const [paymentOptions, setPaymentOptions] = React.useState<any[]>([]);
  const [calculation, setCalculation] = React.useState<OrderCalculationResult | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [couponApplied, setCouponApplied] = React.useState(false);

  // Load Checkout Configuration
  React.useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/checkout/config');
        if (res.ok) {
          const data = await res.json();
          setShippingMethods(data.shippingMethods || []);
          setPaymentOptions(data.paymentMethods || []);
        }
      } catch (err) {
        console.error('Failed to load checkout config:', err);
      } finally {
        setIsLoadingConfig(false);
      }
    }
    loadConfig();
  }, []);

  // Recalculate Totals whenever shipping method or coupon changes
  const runCalculation = React.useCallback(async (appliedCode?: string) => {
    setIsCalculating(true);
    try {
      const res = await fetch('/api/checkout/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingMethodCode: shippingMethod,
          couponCode: appliedCode !== undefined ? appliedCode : couponCode,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCalculation(data.calculation);
        setCouponApplied(Boolean(data.calculation?.coupon));
      } else {
        if (appliedCode) {
          showToast({
            type: 'error',
            title: 'Coupon Error',
            message: data.error || 'Invalid promotional code.',
          });
        }
      }
    } catch {
      console.error('Calculation network failure');
    } finally {
      setIsCalculating(false);
    }
  }, [shippingMethod, couponCode, showToast]);

  React.useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    runCalculation(couponCode.trim());
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !phone || !street || !city || !postalCode) {
      showToast({
        type: 'error',
        title: 'Missing Required Fields',
        message: 'Please complete all contact and delivery details.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/checkout/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: email,
          customerPhone: phone,
          shippingAddress: {
            recipientName: name,
            phone,
            street,
            city,
            postalCode,
            country,
          },
          shippingMethodCode: shippingMethod,
          paymentMethod,
          couponCode: couponApplied ? couponCode : undefined,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Order Placement Error',
          message: data.error || 'Unable to place order. Please check stock.',
        });
      } else {
        showToast({
          type: 'success',
          title: 'Order Confirmed',
          message: `Order #${data.order.orderNumber} placed successfully!`,
        });
        window.dispatchEvent(new Event('cart-updated'));
        router.push(`/order/confirmation/${data.order.orderNumber}`);
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: 'Unable to reach checkout service. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Securing checkout session...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const items = calculation?.items || [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 sm:py-12 flex-1 space-y-8">
        {/* Breadcrumb & Title */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li><Link href="/cart" className="hover:underline">Shopping Bag</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">Checkout</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#141414] flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#087443]" />
            <span>Secure Checkout</span>
          </h1>
        </div>

        <form onSubmit={handlePlaceOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Form Details */}
            <div className="lg:col-span-7 space-y-8">
              {/* Step 1: Customer Contact */}
              <section className="space-y-4 p-6 border border-[#E5E5E5] rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <h2 className="font-heading font-semibold text-base text-[#141414]">
                    1. Contact Information
                  </h2>
                  <span className="text-xs text-[#737373]">Required for order notifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    helperText="Order receipt & tracking updates sent here"
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    helperText="Courier will call before delivery"
                  />
                </div>
              </section>

              {/* Step 2: Shipping Destination */}
              <section className="space-y-4 p-6 border border-[#E5E5E5] rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <h2 className="font-heading font-semibold text-base text-[#141414]">
                    2. Delivery Destination
                  </h2>
                  <span className="text-xs text-[#737373]">Nationwide doorstep delivery</span>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Recipient Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full recipient name"
                  />

                  <Input
                    label="Street Address / House / Apartment"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. House 42, Street 10, Block 4, Clifton"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="City"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Karachi / Lahore / Islamabad"
                    />
                    <Input
                      label="Postal Code"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="e.g. 75500"
                    />
                    <Input
                      label="Country"
                      disabled
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                </div>
              </section>

              {/* Step 3: Shipping Method Selection */}
              <section className="space-y-4 p-6 border border-[#E5E5E5] rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <h2 className="font-heading font-semibold text-base text-[#141414]">
                    3. Delivery Speed
                  </h2>
                </div>

                <div className="space-y-3" role="radiogroup" aria-label="Shipping Options">
                  {shippingMethods.map((sm) => {
                    const isSelected = shippingMethod === sm.code;
                    return (
                      <label
                        key={sm.code}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#087443] bg-[#D3F8DF]/20 ring-1 ring-[#087443]'
                            : 'border-[#E5E5E5] hover:border-[#141414]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={sm.code}
                            checked={isSelected}
                            onChange={() => setShippingMethod(sm.code)}
                            className="text-[#087443] focus:ring-[#087443]"
                          />
                          <div>
                            <span className="font-semibold text-xs text-[#141414] block">
                              {sm.name}
                            </span>
                            <span className="text-[11px] text-[#737373]">
                              Estimated: {sm.estimatedDays}
                            </span>
                          </div>
                        </div>

                        <span className="font-bold text-xs text-[#141414]">
                          {sm.rate === 0 ? 'FREE' : formatCurrency(sm.rate)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Step 4: Payment Method Selection */}
              <section className="space-y-4 p-6 border border-[#E5E5E5] rounded-2xl bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
                  <h2 className="font-heading font-semibold text-base text-[#141414]">
                    4. Payment Selection
                  </h2>
                  <span className="text-xs text-[#737373]">Guaranteed safe transactions</span>
                </div>

                <div className="space-y-3" role="radiogroup" aria-label="Payment Options">
                  {paymentOptions.map((opt) => {
                    const isSelected = paymentMethod === opt.code;
                    const isDisabled = !opt.isConfigured;

                    return (
                      <label
                        key={opt.code}
                        className={`flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                          isDisabled
                            ? 'opacity-60 bg-neutral-50 cursor-not-allowed border-[#E5E5E5]'
                            : isSelected
                            ? 'border-[#087443] bg-[#D3F8DF]/20 ring-1 ring-[#087443]'
                            : 'border-[#E5E5E5] hover:border-[#141414]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={opt.code}
                              disabled={isDisabled}
                              checked={isSelected}
                              onChange={() => setPaymentMethod(opt.code)}
                              className="text-[#087443] focus:ring-[#087443]"
                            />
                            <div>
                              <span className="font-semibold text-xs text-[#141414] flex items-center gap-1.5">
                                {opt.code === 'CASH_ON_DELIVERY' ? (
                                  <Banknote className="w-4 h-4 text-[#087443]" />
                                ) : (
                                  <CreditCard className="w-4 h-4 text-[#737373]" />
                                )}
                                <span>{opt.title}</span>
                              </span>
                              <p className="text-[11px] text-[#737373] mt-0.5">{opt.description}</p>
                            </div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              {/* Special Instructions */}
              <section className="p-4 border border-[#E5E5E5] rounded-xl bg-neutral-50 space-y-2">
                <label htmlFor="order-notes" className="text-xs font-semibold text-[#141414] block">
                  Delivery Notes / Landmark (Optional)
                </label>
                <textarea
                  id="order-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Leave with security guard, call upon arrival"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#D6D6D6] bg-white focus:outline-none focus:border-[#087443] focus:ring-1 focus:ring-[#087443]"
                />
              </section>
            </div>

            {/* Right Column: Order Summary (Visually Dominant Action) */}
            <div className="lg:col-span-5 sticky top-24 space-y-6">
              <Card className="p-6 space-y-6 border border-[#E5E5E5] shadow-sm bg-white">
                <h2 className="font-heading font-bold text-lg text-[#141414] border-b border-[#E5E5E5] pb-4">
                  Order Summary ({items.length} {items.length === 1 ? 'Design' : 'Designs'})
                </h2>

                {/* Purchased Items List Snapshot */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-[#E5E5E5]/60">
                  {items.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs gap-3">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#141414] line-clamp-1">
                          {item.productTitle}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {item.variantTitle} × {item.quantity}
                        </span>
                      </div>
                      <span className="font-bold text-[#141414] shrink-0">
                        {formatCurrency(item.total)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Coupon Form */}
                <div className="pt-4 border-t border-[#E5E5E5] space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Promo Code (e.g. WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="text-xs h-9 uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      className="h-9 shrink-0 text-xs"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponApplied && calculation?.coupon && (
                    <p className="text-xs font-semibold text-[#087443] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Coupon {calculation.coupon.code} applied (-{formatCurrency(calculation.coupon.discountValue)})</span>
                    </p>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="space-y-2.5 pt-4 border-t border-[#E5E5E5] text-xs sm:text-sm">
                  <div className="flex justify-between text-[#525252]">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-[#141414]">
                      {formatCurrency(calculation?.subtotal || 0)}
                    </span>
                  </div>

                  {calculation && calculation.discountTotal > 0 && (
                    <div className="flex justify-between text-[#087443]">
                      <span>Promotion Discount:</span>
                      <span className="font-semibold">
                        -{formatCurrency(calculation.discountTotal)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#525252]">
                    <span>Shipping ({calculation?.shippingMethod.name}):</span>
                    <span className="font-semibold text-[#141414]">
                      {calculation?.shippingTotal === 0 ? (
                        <span className="text-[#087443] font-bold">FREE</span>
                      ) : (
                        formatCurrency(calculation?.shippingTotal || 0)
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E5E5E5] flex justify-between items-baseline">
                    <span className="text-base font-bold text-[#141414]">Grand Total:</span>
                    <span className="text-2xl font-extrabold text-[#141414]">
                      {formatCurrency(calculation?.grandTotal || 0)}
                    </span>
                  </div>
                </div>

                {/* PRIMARY CHECKOUT SUBMIT BUTTON */}
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  isLoading={isSubmitting}
                  className="w-full h-14 text-sm uppercase tracking-wider font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>Confirm & Place Order</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="text-center pt-2 text-[11px] text-[#737373] space-y-1">
                  <p>🔒 256-Bit SSL Encrypted Verification</p>
                  <p>Inventory is reserved upon order placement.</p>
                </div>
              </Card>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
