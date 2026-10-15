'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Package,
  ShoppingBag,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = React.useState<any | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadCustomer() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/customers/${customerId}`);
        if (res.ok) {
          const data = await res.json();
          setCustomer(data.customer);
        } else {
          setError('Customer not found or unauthorized.');
        }
      } catch {
        setError('Network error fetching customer records.');
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomer();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
        <p className="text-xs text-[#737373]">Loading customer profile...</p>
      </div>
    );
  }

  if (!customer || error) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-[#141414]">Customer Not Found</h2>
        <p className="text-xs text-[#737373]">{error || 'This customer record could not be loaded.'}</p>
        <Link
          href="/admin/customers"
          className="inline-flex px-4 py-2 bg-[#141414] text-white rounded-lg text-xs font-semibold"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525252] hover:text-[#141414]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Customers</span>
        </Link>
        <span className="text-xs font-mono text-[#737373]">ID: {customer.id}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#141414]">
            {customer.name}
          </h1>
          <p className="text-xs text-[#737373] mt-0.5">
            Registered on{' '}
            {new Date(customer.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={customer.isActive ? 'mint' : 'outline'} size="md">
            {customer.isActive ? 'Active Account' : 'Deactivated'}
          </Badge>
          <div className="text-right">
            <span className="text-[10px] text-[#737373] block uppercase tracking-wider font-bold">
              Lifetime Spend
            </span>
            <span className="text-base font-black text-[#087443]">
              {formatCurrency(customer.totalSpent)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Addresses */}
        <div className="space-y-6">
          {/* Customer Metadata Card */}
          <Card className="p-5 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Contact Details
            </h2>
            <div className="text-xs space-y-2 text-[#141414]">
              <div className="flex items-center gap-2 text-[#525252]">
                <Mail className="w-4 h-4 text-[#737373] shrink-0" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[#525252]">
                <Phone className="w-4 h-4 text-[#737373] shrink-0" />
                <span>{customer.profile?.phone || 'No phone provided'}</span>
              </div>
              <div className="pt-2 border-t border-[#E5E5E5] text-[11px] text-[#737373]">
                Marketing Opt-In: <strong>{customer.profile?.marketingOptIn ? 'Yes' : 'No'}</strong>
              </div>
            </div>
          </Card>

          {/* Saved Delivery Addresses */}
          <Card className="p-5 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#141414]" />
              <span>Saved Addresses ({customer.addresses?.length || 0})</span>
            </h2>

            {customer.addresses && customer.addresses.length > 0 ? (
              <div className="space-y-3 divide-y divide-[#E5E5E5]">
                {customer.addresses.map((addr: any) => (
                  <div key={addr.id} className="pt-2 first:pt-0 text-xs space-y-0.5 text-[#525252]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#141414]">{addr.recipientName}</span>
                      {addr.isDefault && (
                        <Badge variant="mint" size="sm">Default</Badge>
                      )}
                    </div>
                    <p>{addr.street}</p>
                    <p>{addr.city}, {addr.postalCode}</p>
                    <p className="font-mono text-[11px] text-[#737373]">{addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#737373]">No saved addresses in profile.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Customer Orders History */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-extrabold text-[#141414] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#087443]" />
            <span>Customer Purchase History ({customer.orders?.length || 0})</span>
          </h2>

          <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs divide-y divide-[#E5E5E5]">
            {customer.orders && customer.orders.length > 0 ? (
              customer.orders.map((o: any) => (
                <div key={o.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-neutral-50/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${o.orderNumber}`}
                        className="font-mono font-bold text-sm text-[#141414] hover:text-[#087443] hover:underline"
                      >
                        #{o.orderNumber}
                      </Link>
                      <Badge variant={o.paymentStatus === 'PAID' ? 'mint' : 'outline'} size="sm">
                        {o.paymentStatus}
                      </Badge>
                      <Badge variant={o.fulfillmentStatus === 'DELIVERED' ? 'mint' : 'neutral'} size="sm">
                        {o.fulfillmentStatus}
                      </Badge>
                    </div>
                    <p className="text-[#737373]">
                      Placed on{' '}
                      {new Date(o.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      • {o.items?.length || 0} items
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-[#141414]">
                      {formatCurrency(o.grandTotal)}
                    </span>
                    <Link
                      href={`/admin/orders/${o.orderNumber}`}
                      className="px-3 py-1.5 rounded-lg border border-[#D6D6D6] hover:bg-neutral-100 font-semibold text-xs text-[#141414]"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-[#737373]">This customer has not placed any orders yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
