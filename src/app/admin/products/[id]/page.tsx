'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Package,
  Layers,
  History,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const productId = params.id as string;

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [categories, setCategories] = React.useState<any[]>([]);
  const [productData, setProductData] = React.useState<any | null>(null);

  // Form Fields
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [regularPrice, setRegularPrice] = React.useState('');
  const [salePrice, setSalePrice] = React.useState('');
  const [status, setStatus] = React.useState('DRAFT');
  const [isFeatured, setIsFeatured] = React.useState(false);

  const [images, setImages] = React.useState<{ id?: string; url: string; altText: string }[]>([]);
  const [variants, setVariants] = React.useState<
    {
      id?: string;
      sku: string;
      title: string;
      size: string;
      color: string;
      priceOverride: string;
      inventoryCount: string;
      isAvailable: boolean;
    }[]
  >([]);

  // Load initial product and categories
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch(`/api/admin/products/${productId}`),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData.categories || []);
        }

        if (prodRes.ok) {
          const p = (await prodRes.json()).product;
          setProductData(p);
          setTitle(p.title);
          setSlug(p.slug);
          setCategoryId(p.categoryId);
          setDescription(p.description || '');
          setDetails(p.details || '');
          setRegularPrice(String(p.regularPrice));
          setSalePrice(p.salePrice ? String(p.salePrice) : '');
          setStatus(p.status);
          setIsFeatured(p.isFeatured);
          setImages(
            (p.images || []).map((img: any) => ({
              id: img.id,
              url: img.url,
              altText: img.altText,
            }))
          );
          setVariants(
            (p.variants || []).map((v: any) => ({
              id: v.id,
              sku: v.sku,
              title: v.title,
              size: v.size || '',
              color: v.color || '',
              priceOverride: v.priceOverride ? String(v.priceOverride) : '',
              inventoryCount: String(v.inventoryCount),
              isAvailable: v.isAvailable,
            }))
          );
        } else {
          setErrorMessage('Product not found.');
        }
      } catch {
        setErrorMessage('Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [productId]);

  const handleAddImage = () => {
    setImages((prev) => [
      ...prev,
      {
        url: `https://picsum.photos/seed/laam-${prev.length + 1}/800/1000`,
        altText: title || 'Product shoot view',
      },
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        sku: `LM-${title.slice(0, 3).toUpperCase() || 'VAR'}-${nextIdx}`,
        title: 'Additional Variant',
        size: 'Medium',
        color: 'Default',
        priceOverride: '',
        inventoryCount: '10',
        isAvailable: true,
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const regPriceNum = parseFloat(regularPrice);
      if (isNaN(regPriceNum) || regPriceNum <= 0) {
        setErrorMessage('Regular price must be greater than zero.');
        setIsSubmitting(false);
        return;
      }

      const salePriceNum = salePrice ? parseFloat(salePrice) : null;
      if (salePriceNum !== null && salePriceNum >= regPriceNum) {
        setErrorMessage('Sale price must be strictly less than regular price.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        categoryId,
        description: description.trim(),
        details: details.trim() || undefined,
        regularPrice: regPriceNum,
        salePrice: salePriceNum,
        status,
        isFeatured,
        images: images.map((img, idx) => ({
          id: img.id,
          url: img.url.trim(),
          altText: img.altText.trim() || title.trim(),
          displayOrder: idx,
        })),
        variants: variants.map((v) => ({
          id: v.id,
          sku: v.sku.trim(),
          title: v.title.trim(),
          size: v.size.trim() || undefined,
          color: v.color.trim() || undefined,
          priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
          inventoryCount: parseInt(v.inventoryCount || '0', 10),
          isAvailable: v.isAvailable,
        })),
      };

      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to update product.');
        setIsSubmitting(false);
        return;
      }

      showToast({
        type: 'success',
        title: 'Product Updated',
        message: 'Product changes and variant balances saved successfully.',
      });

      router.push('/admin/products');
      router.refresh();
    } catch {
      setErrorMessage('Connection error saving product updates.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#087443]" />
        <p className="text-xs text-[#737373]">Loading product specification...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#525252] hover:text-[#141414]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Catalog</span>
        </Link>
        {productData?.hasHistoricalOrders && (
          <Badge variant="mint" size="sm">
            Tied to {productData.totalOrderedItems} Ordered Items
          </Badge>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#141414]">
          Edit: {title}
        </h1>
        <p className="text-xs text-[#737373] mt-1">
          Catalog ID: <span className="font-mono">{productId}</span>
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Info */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-3">
            General Product Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Product Title</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Unique URL Slug</label>
              <Input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Category</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Publication Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
              >
                <option value="DRAFT">Draft (Hidden)</option>
                <option value="PUBLISHED">Published (Visible in Storefront)</option>
                <option value="ARCHIVED">Archived (Withdrawn)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-[#087443] focus:ring-[#087443]"
              />
              <label htmlFor="isFeatured" className="text-xs font-semibold text-[#141414]">
                Feature on Homepage
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141414]">Product Narrative</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D6D6D6] p-3 text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141414]">Care & Fabric Details</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full text-xs rounded-lg border border-[#D6D6D6] p-3 text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
            />
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-3">
            Pricing Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Regular Price (PKR)</label>
              <Input
                type="number"
                step="0.01"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">Sale Price (PKR)</label>
              <Input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Gallery */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h2 className="text-sm font-bold text-[#141414]">Product Gallery Media</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddImage}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Image URL
            </Button>
          </div>

          <div className="space-y-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-xl border border-[#E5E5E5] bg-neutral-50/50"
              >
                <div className="w-12 h-14 relative rounded-lg bg-neutral-200 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.altText}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={img.url}
                    onChange={(e) => {
                      const updated = [...images];
                      updated[idx].url = e.target.value;
                      setImages(updated);
                    }}
                    placeholder="Image URL"
                    className="text-xs"
                  />
                  <Input
                    value={img.altText}
                    onChange={(e) => {
                      const updated = [...images];
                      updated[idx].altText = e.target.value;
                      setImages(updated);
                    }}
                    placeholder="Alt Description"
                    className="text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Variants */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <h2 className="text-sm font-bold text-[#141414]">Tracked Variants & Stock</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVariant}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Variant
            </Button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-[#E5E5E5] bg-neutral-50/50 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#737373]">SKU</label>
                    <Input
                      required
                      value={v.sku}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].sku = e.target.value;
                        setVariants(updated);
                      }}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#737373]">Variant Title</label>
                    <Input
                      required
                      value={v.title}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].title = e.target.value;
                        setVariants(updated);
                      }}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#737373]">Inventory Count</label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={v.inventoryCount}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].inventoryCount = e.target.value;
                        setVariants(updated);
                      }}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <Input
                    value={v.size}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].size = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Size"
                    className="text-xs"
                  />
                  <Input
                    value={v.color}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].color = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Color"
                    className="text-xs"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={v.priceOverride}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].priceOverride = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Price Override (Optional)"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
          <Link
            href="/admin/products"
            className="px-5 py-2.5 rounded-lg border border-[#D6D6D6] text-xs font-semibold hover:bg-neutral-100"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-[#087443] hover:bg-[#065F38] text-white font-bold text-xs px-6 py-2.5 rounded-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </span>
            ) : (
              <span>Save Product Changes</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
