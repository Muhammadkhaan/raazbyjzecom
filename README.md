# Laam-Inspired Single-Store eCommerce Platform

A production-oriented, single-store fashion eCommerce application built with **Next.js 15 App Router**, **TypeScript**, **PostgreSQL / Prisma / Firebase Firestore**, and **Tailwind CSS**, adhering to the visual foundations in `/design.md`.

---

## 1. Quick Start & Setup

### Prerequisites
* Node.js v20+ or v22+
* npm or yarn

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Key configuration parameters:
* `DATABASE_URL`: Connection string for PostgreSQL or local dev SQLite database (`file:./dev.db`).
* `AUTH_SECRET`: Secret key used for signing session cookies and reset tokens.
* `INITIAL_ADMIN_EMAIL`: Email for the initial Super-Admin account.
* `INITIAL_ADMIN_PASSWORD`: Complex password for the initial Super-Admin account.

### Database Setup & Migrations
Synchronize schema, generate Prisma Client, and seed real catalog:
```bash
# Push schema to database
npx prisma db push
npx prisma generate

# Seed authentic fashion catalog (Pret, Luxury Festive, Unstitched, Couture, Accessories)
npx tsx scripts/seed-catalog.ts

# Super-Admin one-time bootstrap
npm run db:bootstrap-admin
```

---

## 2. Product Catalog & Discovery System

### 2.1 Route Map
* **`/`** — Storefront homepage showcasing trending collections, featured catalog items, and brand guarantees.
* **`/categories`** — Complete departmental listing displaying collections, image banners, and item counts.
* **`/category/[slug]`** — Dynamic category-filtered collection view with sorting, facet filters, and pagination.
* **`/products`** — Full searchable store catalog with multi-attribute filtering (size, color, in-stock, price range).
* **`/product/[slug]`** — Product Detail Page (PDP) with high-res image gallery, interactive variant selection, live stock counters, fabric specifications, verified reviews, and related products.
* **`/api/catalog/search?q=...`** — Real-time debounced search suggestions endpoint.
* **`/api/database/status`** — System health check validating Prisma and Firestore connectivity.

### 2.2 Catalog Features & Quality Standards
* **Legitimate Pricing & Discounts:** Discount percentages (`% OFF`) are dynamically calculated on the server only when `salePrice < regularPrice`. No arbitrary marketing markdowns.
* **Review Authenticity:** Review ratings and buyer badges are presented only when genuine approved customer reviews exist in the database.
* **Server-Side Validation:** Unpublished/draft items (`status: 'DRAFT'`) are strictly excluded from catalog queries and direct PDP requests (returning HTTP 404).
* **Zero N+1 Queries:** Relational queries use Prisma `include` blocks and aggregate facet extractions in parallel.
* **Responsive & Accessible:** Viewport-responsive image containers, keyboard-operable variant selectors, ARIA combobox search autocomplete, and accessible pagination.

---

---

## 3. Super-Admin Portal & Store Operations

The platform features an administrative portal at `/admin` protected by server-side RBAC guards (`SUPER_ADMIN` and `STAFF` roles):

### 3.1 Route Map
* **`/admin`** — Operational dashboard with real-time, database-backed sales metrics (Gross sales, Paid orders, AOV, Refunds, Low-Stock items), preset date filters (`All Time`, `30 Days`, `7 Days`, `Today`), recent orders, and inventory alarms.
* **`/admin/products`** — Paginated catalog table with category/status filters (`PUBLISHED`, `DRAFT`, `ARCHIVED`), search, quick status toggling, and safe deletion protection (automatically archives products tied to historical orders).
* **`/admin/products/new`** — Comprehensive product creation form for metadata, categories, pricing, image media URLs, and multi-variant SKUs with tracked initial inventory.
* **`/admin/products/[id]`** — Detailed product editing interface supporting variant stock updates and pricing overrides.
* **`/admin/inventory`** — Inventory balance manager with low-stock filter (`≤ 5`), safe stock adjustments (`RESTOCK`, `MANUAL_ADJUSTMENT`, `RETURN`), and immutable ledger history (`InventoryLog`).
* **`/admin/orders`** — Searchable, filterable order fulfillment table (`UNFULFILLED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
* **`/admin/orders/[id]`** — Complete order snapshot inspector, courier and airway bill tracking number updater, and full refund processing with automated inventory return.
* **`/admin/customers`** — Searchable customer directory displaying order counts and lifetime spend without exposing sensitive credentials.
* **`/admin/customers/[id]`** — Customer detail page with saved delivery addresses and comprehensive order history.
* **`/admin/coupons`** — Promotional discount voucher manager with percentage/fixed calculation validation, usage limits, and expiration dates.
* **`/admin/settings`** — Store identity, operating currency (`PKR`), payment method toggles (COD, Stripe, Bank Transfer), shipping courier rates, and low-stock threshold configuration.
* **`/admin/audit-logs`** — Immutable audit log ledger recording actor email, action, entity, and timestamp.

### 3.2 Super-Admin Account Bootstrap
Administrative account creation is restricted and cannot be accessed via public registration endpoints:
```bash
npm run db:bootstrap-admin
```
* Default development credentials (configured in `.env`):
  * **Email:** `admin@laamstore.com`
  * **Password:** `AdminSecurePassword123!`

---

## 4. Verification & Testing

Run the automated test suite (96 tests across catalog discovery, cart/wishlist, checkout, customer accounts, and super-admin operations):
```bash
npm run test
```

Run TypeScript strict type checking:
```bash
npm run type-check
```

Run linter:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

