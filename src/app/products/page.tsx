import { getProducts, getCategories } from '@/lib/catalog/queries';
import { ProductCard } from '@/components/catalog/product-card';
import { ProductFilters } from '@/components/catalog/product-filters';
import { Pagination } from '@/components/catalog/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';

export const metadata = {
  title: 'All Products | Laam Fashion Catalog',
  description: 'Discover designer pret, embroidered luxury lawn, formal ensembles, and artisanal shawls.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    color?: string;
    inStock?: string;
    sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const [catalogData, categories] = await Promise.all([
    getProducts({
      categorySlug: params.category,
      search: params.search,
      minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
      size: params.size,
      color: params.color,
      inStockOnly: params.inStock === 'true',
      sort: params.sort,
      page: params.page ? parseInt(params.page, 10) : 1,
      pageSize: 12,
    }),
    getCategories(),
  ]);

  const { products, totalCount, totalPages, currentPage, facets } = catalogData;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 flex-1">
        {/* Breadcrumb & Title */}
        <div className="space-y-2 mb-8">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">Products</li>
              {params.search && (
                <>
                  <li>/</li>
                  <li className="text-[#087443]">&quot;{params.search}&quot;</li>
                </>
              )}
            </ol>
          </nav>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#141414]">
            {params.search ? `Results for "${params.search}"` : 'All Collections'}
          </h1>
          <p className="text-xs sm:text-sm text-[#737373]">
            Explore handcrafted South Asian designs made with certified pure fabrics and intricate embroidery.
          </p>
        </div>

        {/* Catalog Body with Sidebar Filters and Product Grid */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <ProductFilters
            categories={categories}
            facets={facets}
            totalProducts={totalCount}
          />

          <section className="flex-1 w-full space-y-8" aria-label="Product Catalog">
            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} />
              </>
            ) : (
              <EmptyState
                title="No Matching Designs Found"
                description={
                  params.search
                    ? `We couldn't find any designs matching "${params.search}". Try adjusting your search keywords or resetting your filters.`
                    : 'No products currently match your selected filters. Please adjust the price range, size, or availability filters.'
                }
                actionLabel="Reset All Filters"
                onAction={() => {}}
              />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
