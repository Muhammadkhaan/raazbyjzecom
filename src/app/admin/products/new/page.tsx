'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function NewProductPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [categories, setCategories] = React.useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form State
  const [title, setTitle] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [regularPrice, setRegularPrice] = React.useState('');
  const [salePrice, setSalePrice] = React.useState('');
  const [status, setStatus] = React.useState('DRAFT');
  const [isFeatured, setIsFeatured] = React.useState(false);

  // Images state
  const [images, setImages] = React.useState<{ url: string; altText: string }[]>([
    {
      url: 'https://picsum.photos/seed/laam-new-1/800/1000',
      altText: 'Primary product view',
    },
  ]);

  // Variants state (deterministic initial state to avoid any SSR hydration mismatch)
  const [variants, setVariants] = React.useState<
    {
      sku: string;
      title: string;
      size: string;
      color: string;
      priceOverride: string;
      inventoryCount: string;
    }[]
  >([
    {
      sku: 'LM-VAR-001-S',
      title: 'Small / Standard',
      size: 'Small',
      color: 'Default',
      priceOverride: '',
      inventoryCount: '15',
    },
    {
      sku: 'LM-VAR-001-M',
      title: 'Medium / Standard',
      size: 'Medium',
      color: 'Default',
      priceOverride: '',
      inventoryCount: '20',
    },
  ]);

  // Load categories
  React.useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          if (data.categories?.length > 0) {
            setCategoryId(data.categories[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCategories();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

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
    const nextIndex = variants.length + 1;
    setVariants((prev) => [
      ...prev,
      {
        sku: `LM-VAR-00${nextIndex}-L`,
        title: 'Large / Standard',
        size: 'Large',
        color: 'Default',
        priceOverride: '',
        inventoryCount: '10',
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      showToast({
        type: 'error',
        title: 'Variant Required',
        message: 'A product must possess at least one variant with inventory tracking.',
      });
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
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
          url: img.url.trim(),
          altText: img.altText.trim() || title.trim(),
          displayOrder: idx,
        })),
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          title: v.title.trim(),
          size: v.size.trim() || undefined,
          color: v.color.trim() || undefined,
          priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
          inventoryCount: parseInt(v.inventoryCount || '0', 10),
        })),
      };

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to create product.');
        setIsSubmitting(false);
        return;
      }

      showToast({
        type: 'success',
        title: 'Product Created',
        message: `"${data.product.title}" has been successfully added to the catalog.`,
      });

      router.push('/admin/products');
      router.refresh();
    } catch {
      setErrorMessage('Connection error saving product to database.');
      setIsSubmitting(false);
    }
  };

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
        <span className="text-xs text-[#737373]">Single-Store Admin Engine</span>
      </div>

      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-[#141414]">
          Create New Catalog Product
        </h1>
        <p className="text-xs text-[#737373] mt-1">
          Specify core product metadata, pricing, image media URLs, and inventory variants.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information Card */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-3">
            General Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Product Title <span className="text-rose-600">*</span>
              </label>
              <Input
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Crimson Raw Silk Kurti"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Catalog Slug (Unique URL identifier) <span className="text-rose-600">*</span>
              </label>
              <Input
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. crimson-raw-silk-kurti"
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Category <span className="text-rose-600">*</span>
              </label>
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
              <label className="text-xs font-semibold text-[#141414]">
                Publication Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs font-medium rounded-lg border border-[#D6D6D6] px-3 py-2 bg-white text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
              >
                <option value="DRAFT">Draft (Unpublished)</option>
                <option value="PUBLISHED">Published (Storefront Visible)</option>
                <option value="ARCHIVED">Archived</option>
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
                Feature on Homepage Curations
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141414]">
              Product Narrative & Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of craftsmanship, embroidery, and styling..."
              className="w-full text-xs rounded-lg border border-[#D6D6D6] p-3 text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#141414]">
              Fabric, Care & Specifications
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g. Fabric: 100% Pure Raw Silk. Dry Clean Only. Includes unstitched dupatta."
              className="w-full text-xs rounded-lg border border-[#D6D6D6] p-3 text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#087443]"
            />
          </div>
        </Card>

        {/* Pricing Card */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-[#141414] border-b border-[#E5E5E5] pb-3">
            Pricing & Commercial Rules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Regular Price (PKR) <span className="text-rose-600">*</span>
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="e.g. 12500"
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#141414]">
                Sale Price (PKR, Optional)
              </label>
              <Input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Must be strictly less than regular price"
                className="text-xs font-mono"
              />
            </div>
          </div>
        </Card>

        {/* Product Images Card */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#141414]">Product Gallery Media</h2>
              <p className="text-[11px] text-[#737373]">
                Provide durable image URLs with meaningful accessibility alt-text.
              </p>
            </div>
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

        {/* Variants & Initial Inventory Card */}
        <Card className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#141414]">
                Variants & Inventory Balances
              </h2>
              <p className="text-[11px] text-[#737373]">
                Each variant requires a unique SKU and initial tracked stock level.
              </p>
            </div>
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
                    <label className="text-[10px] font-bold uppercase text-[#737373]">
                      Unique SKU <span className="text-rose-600">*</span>
                    </label>
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
                    <label className="text-[10px] font-bold uppercase text-[#737373]">
                      Variant Title <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      required
                      value={v.title}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].title = e.target.value;
                        setVariants(updated);
                      }}
                      placeholder="e.g. Small / Maroon"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-[#737373]">
                      Initial Inventory Count <span className="text-rose-600">*</span>
                    </label>
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
                    placeholder="Size (e.g. S, M, L, Free Size)"
                    className="text-xs"
                  />
                  <Input
                    value={v.color}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].color = e.target.value;
                      setVariants(updated);
                    }}
                    placeholder="Color (e.g. Crimson, Sage)"
                    className="text-xs"
                  />
                  <div className="flex items-center gap-2">
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
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg shrink-0"
                      title="Remove Variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Submit Action */}
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
                <span>Saving Product...</span>
              </span>
            ) : (
              <span>Publish Product to Catalog</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
