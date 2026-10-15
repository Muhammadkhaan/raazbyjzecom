import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductCard } from '@/components/catalog/product-card';
import { getProducts, getCategories } from '@/lib/catalog/queries';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

export default async function HomePage() {
  const [{ products }, categories] = await Promise.all([
    getProducts({ pageSize: 6, sort: 'newest' }),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-24 px-6 sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Autumn / Winter '26 Festive Collection
            </div>
            <h1 className="text-4xl sm:text-6xl font-serif font-bold text-slate-100 tracking-tight leading-tight">
              Opulent Craftsmanship, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">
                Contemporary Elegance.
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg">
              Explore authentic handcrafted raw silk ensembles, organza kurtas, and micro-velvet peshwas adorned with intricate zari and kora dabka.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                Explore New Arrivals
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-medium border border-slate-700 transition-all"
              >
                Super-Admin Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <section className="py-12 border-y border-slate-800/60 bg-slate-900/40 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif font-bold text-slate-100">Featured Collections</h2>
              <Link href="/categories" className="text-sm text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1">
                View All Collections <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 p-6 transition-all hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5"
                >
                  <div className="space-y-2">
                    <span className="text-xs text-amber-400 font-mono">{cat.productCount} Items Available</span>
                    <h3 className="text-xl font-serif font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-serif font-bold text-slate-100">Latest Ready-To-Wear Arrivals</h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Strictly validated server-side inventory with real time price and stock guarantees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="py-12 border-t border-slate-800/80 bg-slate-900/20 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Global Express Shipping</h4>
                <p className="text-xs text-slate-400 mt-1">Free express courier shipping on orders over PKR 10,000.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Guaranteed Authenticity</h4>
                <p className="text-xs text-slate-400 mt-1">100% handcrafted pure silk, organza and velvet fabrics.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Seamless Returns</h4>
                <p className="text-xs text-slate-400 mt-1">30-day hassle-free exchange and customer support.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Super-Admin Controlled</h4>
                <p className="text-xs text-slate-400 mt-1">Full database persistence, order lifecycle & store metrics.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
