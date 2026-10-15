import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-[#E5E5E5] bg-neutral-50 py-12 text-xs text-[#737373]">
      <div className="container-storefront space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-[#141414]">Collections</h4>
            <ul className="space-y-2">
              <li><Link href="/category/pret" className="hover:underline">Pret Ready-to-Wear</Link></li>
              <li><Link href="/category/unstitched" className="hover:underline">Unstitched Luxury</Link></li>
              <li><Link href="/category/festive" className="hover:underline">Luxury Festive</Link></li>
              <li><Link href="/category/formal" className="hover:underline">Formal & Bridal</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-[#141414]">Customer Care</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:underline">Shipping & Delivery</Link></li>
              <li><Link href="/" className="hover:underline">7-Day Returns Policy</Link></li>
              <li><Link href="/" className="hover:underline">Size Chart & Fit Guide</Link></li>
              <li><Link href="/" className="hover:underline">Track Your Order</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-[#141414]">About Laam</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="hover:underline">Our Artisans</Link></li>
              <li><Link href="/" className="hover:underline">Fabric Authenticity</Link></li>
              <li><Link href="/" className="hover:underline">Sustainable Practices</Link></li>
              <li><Link href="/" className="hover:underline">Contact Concierge</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-[#141414]">Studio Promise</h4>
            <p className="text-xs leading-relaxed text-[#525252]">
              100% authentic designer pieces curated with transparent pricing, guaranteed fabric grades, and nationwide express fulfillment.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Laam Studio. Fashion-forward eCommerce architecture.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">Privacy Policy</Link>
            <Link href="/" className="hover:underline">Terms of Service</Link>
            <Link href="/categories" className="hover:underline">All Collections</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
