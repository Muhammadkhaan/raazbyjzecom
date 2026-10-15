'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  MapPin, 
  Heart, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Loader2 
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AccountNav } from '@/components/account/account-nav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

export default function AccountDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/account/dashboard');
        if (res.ok) {
          const data = await res.json();
          setDashboard(data.dashboard);
        } else if (res.status === 401) {
          router.push('/');
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="container-storefront py-20 flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading your account dashboard...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const user = dashboard?.user;
  const recentOrders = dashboard?.recentOrders || [];
  const defaultAddress = dashboard?.defaultAddress;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 sm:py-12 flex-1 space-y-8">
        {/* Breadcrumb & Welcome Banner */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">My Account</li>
            </ol>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
                Welcome back, {user?.name}
              </h1>
              <p className="text-xs text-[#737373]">
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • {user?.email}
              </p>
            </div>
            <Badge variant="mint" size="md">
              Verified Customer Account
            </Badge>
          </div>
        </div>

        {/* Account Body Grid */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountNav />

          <section className="flex-1 w-full space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-5 border border-[#E5E5E5] space-y-1">
                <div className="flex items-center justify-between text-[#737373]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                  <Package className="w-4 h-4 text-[#087443]" />
                </div>
                <p className="text-2xl font-extrabold text-[#141414]">{recentOrders.length}</p>
                <Link href="/account/orders" className="text-[11px] text-[#087443] font-medium hover:underline block pt-1">
                  View Order History →
                </Link>
              </Card>

              <Card className="p-5 border border-[#E5E5E5] space-y-1">
                <div className="flex items-center justify-between text-[#737373]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Default Destination</span>
                  <MapPin className="w-4 h-4 text-[#087443]" />
                </div>
                <p className="text-xs font-semibold text-[#141414] line-clamp-1">
                  {defaultAddress ? `${defaultAddress.city}, ${defaultAddress.country}` : 'None Set'}
                </p>
                <Link href="/account/addresses" className="text-[11px] text-[#087443] font-medium hover:underline block pt-1">
                  Manage Addresses →
                </Link>
              </Card>

              <Card className="p-5 border border-[#E5E5E5] space-y-1">
                <div className="flex items-center justify-between text-[#737373]">
                  <span className="text-xs font-semibold uppercase tracking-wider">Saved Wishlist</span>
                  <Heart className="w-4 h-4 text-[#087443]" />
                </div>
                <p className="text-2xl font-extrabold text-[#141414]">{dashboard?.wishlistCount || 0}</p>
                <Link href="/wishlist" className="text-[11px] text-[#087443] font-medium hover:underline block pt-1">
                  Browse Wishlist →
                </Link>
              </Card>
            </div>

            {/* Recent Orders Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#141414]">Recent Orders</h2>
                <Link href="/account/orders" className="text-xs font-semibold text-[#087443] hover:underline">
                  All Orders ({recentOrders.length})
                </Link>
              </div>

              {recentOrders.length > 0 ? (
                <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden divide-y divide-[#E5E5E5]">
                  {recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#141414]">
                            #{order.orderNumber}
                          </span>
                          <Badge variant={order.paymentStatus === 'PAID' ? 'mint' : 'outline'} size="sm">
                            {order.paymentStatus}
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            {order.fulfillmentStatus}
                          </Badge>
                        </div>
                        <p className="text-[#737373]">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {order.itemCount} items
                        </p>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="font-bold text-sm text-[#141414]">
                          {formatCurrency(order.grandTotal)}
                        </span>
                        <Link
                          href={`/account/orders/${order.orderNumber}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-[#D6D6D6] hover:bg-neutral-50 text-xs font-medium text-[#141414] transition-colors"
                        >
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-[#E5E5E5] bg-neutral-50 text-center space-y-3">
                  <Package className="w-8 h-8 text-[#737373] mx-auto" />
                  <p className="text-xs text-[#737373]">You haven&apos;t placed any orders yet.</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/products')}
                  >
                    Start Shopping
                  </Button>
                </div>
              )}
            </div>

            {/* Default Shipping Address Snapshot */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#141414]">Primary Delivery Address</h2>
                <Link href="/account/addresses" className="text-xs font-semibold text-[#087443] hover:underline">
                  Manage Addresses
                </Link>
              </div>

              {defaultAddress ? (
                <Card className="p-5 border border-[#E5E5E5] space-y-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#141414]">{defaultAddress.recipientName}</span>
                    <Badge variant="mint" size="sm">Default</Badge>
                  </div>
                  <div className="text-xs text-[#525252] space-y-0.5">
                    <p>{defaultAddress.street}</p>
                    <p>{defaultAddress.city}, {defaultAddress.postalCode}</p>
                    <p>{defaultAddress.country}</p>
                    <p className="text-[#737373] pt-1">Phone: {defaultAddress.phone}</p>
                  </div>
                </Card>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-[#D6D6D6] text-center space-y-2">
                  <p className="text-xs text-[#737373]">No primary delivery address saved yet.</p>
                  <Link
                    href="/account/addresses"
                    className="inline-block text-xs font-semibold text-[#087443] hover:underline"
                  >
                    + Add New Delivery Address
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
