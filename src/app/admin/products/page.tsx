'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/catalog/pagination';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

function AdminProductsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [search, setSearch] = React.useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  const [status, setStatus] = React.useState(searchParams.get('status') || 'ALL');
  const [categoryId, setCategoryId] = React.useState(searchParams.get('categoryId') || 'ALL');

  const [categories, setCategories] = React.useState<any[]>([]);
  const [products, setProducts] = React.useState<any[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(true);

  // Deletion state
  const [productToDelete, setProductToDelete] = React.useState<any | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load categories
  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  // Load products
  const loadProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(currentPage));
      q.set('pageSize', '10');
      if (debouncedSearch) q.set('search', debouncedSearch);
      if (status !== 'ALL') q.set('status', status);
      if (categoryId !== 'ALL') q.set('categoryId', categoryId);

      const res = await fetch(`/api/admin/products?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, status, categoryId]);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleQuickStatusChange = async (productId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Status Updated',
          message: `Product transitioned to ${newStatus}.`,
        });
        loadProducts();
      } else {
        const err = await res.json();
        showToast({ type: 'error', title: 'Update Failed', message: err.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to update status.' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast({
          type: 'success',
          title: data.action === 'ARCHIVED' ? 'Product Archived' : 'Product Deleted',
          message: data.message,
        });
        setProductToDelete(null);
        loadProducts();
      } else {
        showToast({ type: 'error', title: 'Operation Failed', message: data.error });
      }
    } catch {
      showToast({ type: 'error', title: 'Error', message: 'Failed to execute deletion.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Product CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Product Catalog Management ({totalCount})
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Create, publish, edit pricing, manage variants, and safeguard historical product orders.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#141414] text-white hover:bg-[#333333] transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#73E2A3]" />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, SKU, or slug..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
          >
            <option value="ALL">All Publication Statuses</option>
            <option value="PUBLISHED">Published (Live in Catalog)</option>
            <option value="DRAFT">Draft (Hidden)</option>
            <option value="ARCHIVED">Archived (Withdrawn)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
          >
            <option value="ALL">All Store Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Product Table */}
      <div className="border border-[#E5E5E5] rounded-2xl bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
            <p className="text-xs text-[#737373]">Loading product catalog...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-[#E5E5E5] text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / Sale</th>
                  <th className="py-3 px-4">Variants & Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {products.map((product) => {
                  const statusVariant =
                    product.status === 'PUBLISHED'
                      ? 'mint'
                      : product.status === 'DRAFT'
                      ? 'neutral'
                      : 'outline';

                  return (
                    <tr key={product.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 relative bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-[#E5E5E5]">
                            {product.primaryImage ? (
                              <Image
                                src={product.primaryImage.url}
                                alt={product.primaryImage.altText || product.title}
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
                              href={`/admin/products/${product.id}`}
                              className="font-bold text-sm text-[#141414] hover:text-[#087443] hover:underline"
                            >
                              {product.title}
                            </Link>
                            <p className="text-[11px] font-mono text-[#737373]">
                              /{product.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-[#525252] font-medium">
                        {product.categoryName}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-[#141414]">
                          {formatCurrency(product.regularPrice)}
                        </div>
                        {product.salePrice && (
                          <div className="text-[11px] text-[#087443] font-semibold">
                            Sale: {formatCurrency(product.salePrice)}
                          </div>
                        )}
                      </td>

                      {/* Variants & Stock */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#141414]">
                          {product.totalInventory} units
                        </span>
                        <p className="text-[11px] text-[#737373]">
                          {product.variantsCount} {product.variantsCount === 1 ? 'variant' : 'variants'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant} size="sm">
                          {product.status}
                        </Badge>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {product.status === 'PUBLISHED' ? (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(product.id, 'DRAFT')}
                              title="Unpublish (set to DRAFT)"
                              className="px-2 py-1 rounded border border-[#D6D6D6] text-[11px] font-semibold hover:bg-neutral-100"
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickStatusChange(product.id, 'PUBLISHED')}
                              title="Publish live to catalog"
                              className="px-2 py-1 rounded bg-[#D3F8DF] text-[#087443] text-[11px] font-semibold hover:bg-[#b2f0c7]"
                            >
                              Publish
                            </button>
                          )}

                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-1.5 rounded-lg text-[#525252] hover:text-[#141414] hover:bg-neutral-100"
                            title="Edit Product & Variants"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                            title="Delete or Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            <Package className="w-8 h-8 text-[#A3A3A3] mx-auto" />
            <h3 className="font-semibold text-sm text-[#141414]">No products match this filter</h3>
            <p className="text-xs text-[#737373]">
              Try clearing your search query or adjusting your category/status filters.
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

      {/* Delete / Archive Confirmation Dialog */}
      {productToDelete && (
        <Dialog
          isOpen={Boolean(productToDelete)}
          onClose={() => setProductToDelete(null)}
          title="Confirm Product Removal"
          description="Enforces database integrity and historical customer order protection."
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#525252] leading-relaxed">
              Are you sure you want to remove <strong>{productToDelete.title}</strong>?
            </p>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Safe Order Protection Policy:</p>
              <p className="text-[11px]">
                If this product has ever been purchased in any settled or historical customer orders,
                it will automatically be safely <strong>ARCHIVED</strong> rather than permanently deleted,
                preserving financial receipts and order items snapshots.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Processing...' : 'Confirm Safe Removal'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
          <p className="text-xs text-[#737373]">Loading products...</p>
        </div>
      }
    >
      <AdminProductsList />
    </React.Suspense>
  );
}
