import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryBySlug, getProducts, getCategories } from '@/lib/catalog/queries';
import { ProductCard } from '@/components/catalog/product-card';
import { ProductFilters } from '@/components/catalog/product-filters';
import { Pagination } from '@/components/catalog/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    size?: string;
    color?: string;
    inStock?: string;
    sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
    page?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Category Not Found | Laam Studio' };
  }

  return {
    title: `${category.name} | Laam Studio`,
    description: category.description || `Browse our latest ${category.name} arrivals.`,
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const queryParams = await searchParams;

  const [catalogData, categories] = await Promise.all([
    getProducts({
      categorySlug: category.slug,
      minPrice: queryParams.minPrice ? parseFloat(queryParams.minPrice) : undefined,
      maxPrice: queryParams.maxPrice ? parseFloat(queryParams.maxPrice) : undefined,
      size: queryParams.size,
      color: queryParams.color,
      inStockOnly: queryParams.inStock === 'true',
      sort: queryParams.sort,
      page: queryParams.page ? parseInt(queryParams.page, 10) : 1,
      pageSize: 12,
    }),
    getCategories(),
  ]);

  const { products, totalCount, totalPages, currentPage, facets } = catalogData;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-8 flex-1">
        {/* Category Header */}
        <div className="space-y-3 mb-8 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li><Link href="/categories" className="hover:underline">Collections</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">{category.name}</li>
            </ol>
          </nav>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141414]">
            {category.name}
          </h1>

          {category.description && (
            <p className="text-xs sm:text-sm text-[#525252] max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}
        </div>

        {/* Catalog Body with Sidebar Filters and Product Grid */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <ProductFilters
            categories={categories}
            facets={facets}
            currentCategorySlug={category.slug}
            totalProducts={totalCount}
          />

          <section className="flex-1 w-full space-y-8" aria-label={`${category.name} Products`}>
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
                title="No Products Available In This Category"
                description="We could not find any items matching your selected criteria. Try adjusting your filters or browsing other categories."
                actionLabel="Explore All Collections"
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
