import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getRelatedProducts } from '@/lib/catalog/queries';
import { ProductGallery } from '@/components/catalog/product-gallery';
import { VariantSelector } from '@/components/catalog/variant-selector';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { formatCurrency } from '@/lib/utils';
import { ShieldCheck, Truck, RotateCcw, Check, Sparkles, Star } from 'lucide-react';
import Image from 'next/image';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | Laam Studio' };
  }

  return {
    title: `${product.title} | Laam Studio`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  // STRICT VALIDATION: If product does not exist or status !== 'PUBLISHED', return 404
  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 sm:py-12 flex-1 space-y-16">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li>/</li>
            <li><Link href="/categories" className="hover:underline">Collections</Link></li>
            <li>/</li>
            <li><Link href={`/category/${product.category.slug}`} className="hover:underline">{product.category.name}</Link></li>
            <li>/</li>
            <li className="font-semibold text-[#141414] truncate max-w-xs">{product.title}</li>
          </ol>
        </nav>

        {/* Primary Product Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery
              title={product.title}
              images={product.images.map((img) => ({
                id: img.id,
                url: img.url,
                altText: img.altText,
              }))}
            />
          </div>

          {/* Right Column: Pricing, Variant Selection, Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Category Header */}
            <div className="space-y-2 border-b border-[#E5E5E5] pb-5">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/category/${product.category.slug}`}
                  className="text-xs font-semibold uppercase tracking-wider text-[#087443] hover:underline"
                >
                  {product.category.name}
                </Link>

                <div className="flex items-center gap-2">
                  {product.discountPercentage && (
                    <Badge variant="blush" size="sm">
                      {product.discountPercentage}% OFF
                    </Badge>
                  )}
                  {product.isFeatured && (
                    <Badge variant="mint" size="sm">
                      Featured
                    </Badge>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414] leading-tight">
                {product.title}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-1">
                {product.salePrice ? (
                  <>
                    <span className="text-2xl font-bold text-[#141414]">
                      {formatCurrency(product.salePrice)}
                    </span>
                    <span className="text-sm text-[#737373] line-through">
                      {formatCurrency(product.regularPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-[#141414]">
                    {formatCurrency(product.regularPrice)}
                  </span>
                )}
                <span className="text-xs text-[#737373]">Taxes included</span>
              </div>

              {/* Review Stars (Rendered ONLY if genuine reviews exist) */}
              {product.reviewCount > 0 && product.averageRating !== null && (
                <div className="flex items-center gap-1.5 pt-1 text-xs text-[#525252]">
                  <div className="flex text-amber-500" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(product.averageRating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-[#141414]">{product.averageRating}</span>
                  <span className="text-[#737373]">({product.reviewCount} verified reviews)</span>
                </div>
              )}
            </div>

            {/* Interactive Variant Selection (Colors, Sizes, Stock, Bag Button) */}
            <VariantSelector
              productId={product.id}
              productTitle={product.title}
              variants={product.variants.map((v) => ({
                id: v.id,
                sku: v.sku,
                title: v.title,
                size: v.size,
                color: v.color,
                priceOverride: v.priceOverride,
                inventoryCount: v.inventoryCount,
                isAvailable: v.isAvailable,
              }))}
              basePrice={product.salePrice || product.regularPrice}
            />

            {/* Trust & Guarantee Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#E5E5E5] text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-[#E5E5E5]">
                <Truck className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#141414]">Express Delivery</h4>
                  <p className="text-[11px] text-[#737373]">3-5 business days nationwide</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-[#E5E5E5]">
                <ShieldCheck className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#141414]">Authenticity</h4>
                  <p className="text-[11px] text-[#737373]">100% genuine pure fabric</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 border border-[#E5E5E5]">
                <RotateCcw className="w-4 h-4 text-[#087443] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#141414]">7-Day Returns</h4>
                  <p className="text-[11px] text-[#737373]">Hassle-free exchange policy</p>
                </div>
              </div>
            </div>

            {/* Product Overview & Fabric Details */}
            <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-[#141414]">Design Overview</h3>
                <p className="text-xs sm:text-sm text-[#525252] leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.details && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-semibold text-sm text-[#141414]">Fabrication & Care</h3>
                  <div className="bg-neutral-50 rounded-xl p-4 text-xs text-[#525252] whitespace-pre-line leading-relaxed font-mono">
                    {product.details}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section (Rendered strictly when real reviews exist) */}
        {product.reviews.length > 0 && (
          <section className="space-y-6 pt-10 border-t border-[#E5E5E5]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#141414]">
                  Customer Reviews ({product.reviews.length})
                </h2>
                <p className="text-xs text-[#737373]">
                  Verified feedback from confirmed buyers.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#141414]">
                ★ {product.averageRating} / 5.0
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map((rev) => (
                <Card key={rev.id} className="p-5 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-[#141414]">
                        {rev.user.name}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#087443] bg-[#D3F8DF] px-1.5 py-0.5 rounded-full font-medium">
                          <Check className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <div className="flex text-amber-500 text-xs">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    &quot;{rev.reviewText}&quot;
                  </p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-10 border-t border-[#E5E5E5]">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#141414]">
                Complete The Look
              </h2>
              <p className="text-xs text-[#737373]">
                Coordinated pieces and complementary styles from {product.category.name}.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/product/${rel.slug}`}
                  className="group block space-y-2 focus-visible:outline-2 focus-visible:outline-[#087443]"
                >
                  <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-neutral-100 border border-[#E5E5E5]">
                    {rel.imageUrl ? (
                      <Image
                        src={rel.imageUrl}
                        alt={rel.altText || rel.title}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#737373]">
                        No Image
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading font-medium text-xs text-[#141414] line-clamp-1 group-hover:text-[#087443] transition-colors">
                      {rel.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#141414]">
                      {formatCurrency(rel.salePrice || rel.regularPrice)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
