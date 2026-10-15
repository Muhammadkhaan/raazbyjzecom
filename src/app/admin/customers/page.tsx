'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Eye,
  ShoppingBag,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/catalog/pagination';
import { formatCurrency } from '@/lib/utils';

function AdminCustomersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);

  const [customers, setCustomers] = React.useState<any[]>([]);
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

  const loadCustomers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(currentPage));
      q.set('pageSize', '10');
      if (debouncedSearch) q.set('search', debouncedSearch);

      const res = await fetch(`/api/admin/customers?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  React.useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Customer Directory & Accounts ({totalCount})
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Registered customer profiles, cumulative order spending, and delivery histories.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name or email address..."
            className="pl-9 text-xs"
          />
        </div>
      </Card>

      {/* Customers Table */}
      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
            <p className="text-xs text-[#737373]">Loading customer accounts...</p>
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Orders Placed</th>
                  <th className="py-3 px-4">Lifetime Spend</th>
                  <th className="py-3 px-4">Registration</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Customer Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[#141414]">{c.name}</div>
                      <span className="text-[10px] font-mono text-[#737373]">ID: {c.id.slice(0, 8)}...</span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 text-[#525252]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#737373]" />
                        <span>{c.email}</span>
                      </div>
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#737373]">
                          <Phone className="w-3 h-3" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Orders Placed */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#141414]">{c.ordersCount} orders</span>
                    </td>

                    {/* Total Spend */}
                    <td className="py-3 px-4 font-black text-sm text-[#087443]">
                      {formatCurrency(c.totalSpend)}
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-4 text-[#737373]">
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D6D6D6] font-semibold text-xs text-[#141414] hover:bg-neutral-100 transition-colors"
                      >
                        <span>Profile & Orders</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Users className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h3 className="font-semibold text-sm text-[#141414]">No customer accounts found</h3>
            <p className="text-xs text-[#737373]">Try adjusting your search query.</p>
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

export default function AdminCustomersPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading customers...</p>
        </div>
      }
    >
      <AdminCustomersList />
    </React.Suspense>
  );
}
