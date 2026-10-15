import { describe, it, expect } from 'vitest';
import { getProducts, getProductBySlug, getCategoryBySlug, getCategories } from '@/lib/catalog/queries';

describe('Real Product Catalog & Discovery System', () => {
  describe('1. Category Retrieval & Validation', () => {
    it('retrieves all active categories with product counts', async () => {
      const categories = await getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some((c) => c.slug === 'pret')).toBe(true);
      expect(categories.some((c) => c.slug === 'festive')).toBe(true);
    });

    it('retrieves valid category by slug', async () => {
      const cat = await getCategoryBySlug('pret');
      expect(cat).not.toBeNull();
      expect(cat?.name).toBe('Pret Ready-to-Wear');
    });

    it('returns null for non-existent category slug', async () => {
      const invalid = await getCategoryBySlug('non-existent-category-slug-12345');
      expect(invalid).toBeNull();
    });
  });

  describe('2. Search & Text Matching', () => {
    it('finds products matching search keyword in title or description', async () => {
      const result = await getProducts({ search: 'Silk' });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products.some((p) => p.title.toLowerCase().includes('silk') || p.description.toLowerCase().includes('silk'))).toBe(true);
    });

    it('returns empty results for non-matching search queries', async () => {
      const result = await getProducts({ search: 'UnicornAlienSpaceship999' });
      expect(result.products).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('3. Sorting Behavior', () => {
    it('sorts products by price ascending', async () => {
      const result = await getProducts({ sort: 'price-asc', pageSize: 10 });
      expect(result.products.length).toBeGreaterThan(1);
      for (let i = 0; i < result.products.length - 1; i++) {
        expect(result.products[i].regularPrice).toBeLessThanOrEqual(result.products[i + 1].regularPrice);
      }
    });

    it('sorts products by price descending', async () => {
      const result = await getProducts({ sort: 'price-desc', pageSize: 10 });
      expect(result.products.length).toBeGreaterThan(1);
      for (let i = 0; i < result.products.length - 1; i++) {
        expect(result.products[i].regularPrice).toBeGreaterThanOrEqual(result.products[i + 1].regularPrice);
      }
    });
  });

  describe('4. Attribute Filtering (Size, Color, Availability)', () => {
    it('filters products by size', async () => {
      const result = await getProducts({ size: 'Small' });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products.every((p) => p.availableSizes.includes('Small'))).toBe(true);
    });

    it('filters products by color', async () => {
      const result = await getProducts({ color: 'Crimson' });
      expect(result.products.length).toBeGreaterThan(0);
      expect(result.products.every((p) => p.availableColors.includes('Crimson'))).toBe(true);
    });

    it('filters products by in-stock availability', async () => {
      const result = await getProducts({ inStockOnly: true });
      expect(result.products.every((p) => p.totalStock > 0 && p.isAvailable)).toBe(true);
    });
  });

  describe('5. Pagination', () => {
    it('paginates results based on page and pageSize', async () => {
      const pageSize = 2;
      const page1 = await getProducts({ page: 1, pageSize });
      const page2 = await getProducts({ page: 2, pageSize });

      expect(page1.products.length).toBeLessThanOrEqual(pageSize);
      expect(page1.currentPage).toBe(1);
      expect(page2.currentPage).toBe(2);

      // Verify that page 1 and page 2 contain different products
      if (page1.products.length > 0 && page2.products.length > 0) {
        expect(page1.products[0].id).not.toBe(page2.products[0].id);
      }
    });
  });

  describe('6. Product Detail & Slug Validation', () => {
    it('loads published product details, variants, and gallery', async () => {
      const product = await getProductBySlug('zari-embroidered-raw-silk-ensemble');
      expect(product).not.toBeNull();
      expect(product?.title).toBe('Zari Embroidered Raw Silk Ensemble');
      expect(product?.variants.length).toBeGreaterThan(0);
      expect(product?.images.length).toBeGreaterThan(0);
      expect(product?.status).toBe('PUBLISHED');
    });

    it('STRICTLY BLOCKS unpublished/draft products from public discovery', async () => {
      // 'archived-studio-prototype' is seeded with status: 'DRAFT'
      const leaked = await getProductBySlug('archived-studio-prototype');
      expect(leaked).toBeNull();

      const catalogQuery = await getProducts({ search: 'Archived Studio Prototype' });
      expect(catalogQuery.products).toHaveLength(0);
    });

    it('returns null on non-existent product slug', async () => {
      const invalid = await getProductBySlug('non-existent-product-slug');
      expect(invalid).toBeNull();
    });
  });

  describe('7. Legitimacy & Calculation Checks', () => {
    it('computes legitimate discount percentage strictly when salePrice < regularPrice', async () => {
      const product = await getProductBySlug('zari-embroidered-raw-silk-ensemble');
      expect(product?.salePrice).not.toBeNull();
      expect(product?.salePrice).toBeLessThan(product!.regularPrice);
      expect(product?.discountPercentage).toBe(25); // (22000 - 16500) / 22000 = 25%
    });

    it('handles products without discounts without fabricating percentages', async () => {
      const fullPriceProduct = await getProductBySlug('heavy-hand-embellished-velvet-peshwas');
      expect(fullPriceProduct?.salePrice).toBeNull();
      expect(fullPriceProduct?.discountPercentage).toBeNull();
    });

    it('only presents real reviews and does not fabricate rating when no reviews exist', async () => {
      const unreviewed = await getProductBySlug('heavy-hand-embellished-velvet-peshwas');
      expect(unreviewed?.reviewCount).toBe(0);
      expect(unreviewed?.averageRating).toBeNull();
    });
  });
});
