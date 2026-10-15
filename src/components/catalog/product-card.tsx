import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { ProductSummary } from '@/lib/catalog/queries';

export interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const isOutOfStock = !product.isAvailable || product.totalStock <= 0;
  const isLowStock = !isOutOfStock && product.totalStock <= 5;

  return (
    <article className="group relative flex flex-col rounded-xl border border-[#E5E5E5] bg-white overflow-hidden transition-all duration-200 hover:shadow-md hover:border-[#D6D6D6]">
      {/* Product Image Area */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[3/4] w-full bg-neutral-100 overflow-hidden focus-visible:outline-2 focus-visible:outline-[#087443] focus-visible:outline-offset-2"
        aria-label={`View ${product.title}`}
      >
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText || product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-neutral-100 via-neutral-200 to-neutral-100 text-[#737373] text-xs font-medium">
            <span>No Image Available</span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.discountPercentage !== null && product.discountPercentage > 0 && (
            <Badge variant="blush" size="sm">
              {product.discountPercentage}% OFF
            </Badge>
          )}
          {product.isFeatured && (
            <Badge variant="mint" size="sm">
              FEATURED
            </Badge>
          )}
        </div>

        {/* Stock Status Tag */}
        {isOutOfStock ? (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 py-1 px-2 rounded-md bg-[#141414]/80 text-white text-[11px] font-semibold text-center backdrop-blur-xs">
            Sold Out
          </div>
        ) : isLowStock ? (
          <div className="absolute bottom-2.5 left-2.5 py-0.5 px-2 rounded-md bg-amber-500/90 text-white text-[10px] font-medium backdrop-blur-xs">
            Only {product.totalStock} left
          </div>
        ) : null}
      </Link>

      {/* Metadata & Pricing Details */}
      <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#737373]">
            {product.category.name}
          </p>

          <h3 className="font-heading font-medium text-sm text-[#141414] line-clamp-2 leading-snug group-hover:text-[#087443] transition-colors">
            <Link href={`/product/${product.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-[#087443]">
              {product.title}
            </Link>
          </h3>
        </div>

        {/* Price & Review Row */}
        <div className="pt-2 border-t border-[#E5E5E5]/60 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            {product.salePrice ? (
              <>
                <span className="font-bold text-base text-[#141414]">
                  {formatCurrency(product.salePrice)}
                </span>
                <span className="text-xs text-[#737373] line-through">
                  {formatCurrency(product.regularPrice)}
                </span>
              </>
            ) : (
              <span className="font-bold text-base text-[#141414]">
                {formatCurrency(product.regularPrice)}
              </span>
            )}
          </div>

          {/* Genuine Reviews (Only displayed when review count exists and > 0) */}
          {product.reviewCount > 0 && product.averageRating !== null && (
            <span className="text-[11px] font-medium text-[#737373]" title={`${product.reviewCount} customer reviews`}>
              ★ {product.averageRating} ({product.reviewCount})
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
