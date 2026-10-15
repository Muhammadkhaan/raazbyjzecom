import Link from 'next/link';
import Image from 'next/image';
import { getCategories } from '@/lib/catalog/queries';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata = {
  title: 'All Collections & Categories | Laam Studio',
  description: 'Explore authentic pret, luxury festive, unstitched lawn, couture, and artisanal accessories.',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="container-storefront py-10 sm:py-14 space-y-8 flex-1">
        {/* Header Breadcrumb & Title */}
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <nav aria-label="Breadcrumb" className="text-xs text-[#737373]">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li>/</li>
              <li className="font-semibold text-[#141414]">Collections</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#141414]">
            Store Departments & Collections
          </h1>
          <p className="text-sm text-[#525252] max-w-2xl leading-relaxed">
            Browse our signature collections from prêt-à-porter staples to heirloom bridal formals and hand-woven artisanal accessories.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E5E5E5] bg-white transition-all duration-300 hover:shadow-lg hover:border-[#D6D6D6]"
            >
              <div className="relative aspect-[4/3] w-full bg-neutral-100 overflow-hidden">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-[#D3F8DF]/40 to-neutral-200">
                    <Sparkles className="w-8 h-8 text-[#087443]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D3F8DF]">
                    {cat.productCount} {cat.productCount === 1 ? 'Design' : 'Designs'}
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-white group-hover:text-[#D3F8DF] transition-colors">
                    {cat.name}
                  </h2>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between text-xs text-[#525252]">
                <p className="line-clamp-2 pr-2">{cat.description}</p>
                <span className="shrink-0 p-1.5 rounded-full bg-neutral-100 group-hover:bg-[#141414] group-hover:text-white transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
