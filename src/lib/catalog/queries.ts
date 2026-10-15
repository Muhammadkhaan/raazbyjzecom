import { db } from '@/lib/db';
export namespace Prisma {
  export type ProductWhereInput = any;
  export type ProductVariantWhereInput = any;
  export type ProductOrderByWithRelationInput = any;
}

export interface CatalogQueryParams {
  categorySlug?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  inStockOnly?: boolean;
  sort?: 'newest' | 'price-asc' | 'price-desc' | 'popular';
  page?: number;
  pageSize?: number;
}

export interface ProductSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  regularPrice: number;
  salePrice: number | null;
  discountPercentage: number | null;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  primaryImage: {
    url: string;
    altText: string;
  } | null;
  availableSizes: string[];
  availableColors: string[];
  totalStock: number;
  isAvailable: boolean;
  averageRating: number | null;
  reviewCount: number;
}

/**
 * Retrieves all active categories with counts of published products
 */
export async function getCategories() {
  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          products: {
            where: { status: 'PUBLISHED' },
          },
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageUrl: cat.imageUrl,
    productCount: cat._count.products,
  }));
}

/**
 * Retrieves a single active category by its slug
 */
export async function getCategoryBySlug(slug: string) {
  if (!slug || typeof slug !== 'string') return null;

  return db.category.findFirst({
    where: {
      slug: slug.toLowerCase().trim(),
      isActive: true,
    },
  });
}

/**
 * Retrieves paginated products matching search, category, and attribute filters
 * Strictly enforces status: 'PUBLISHED'
 */
export async function getProducts(params: CatalogQueryParams = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(params.pageSize) || 12));
  const skip = (page - 1) * pageSize;

  // Build where conditions
  const where: Prisma.ProductWhereInput = {
    status: 'PUBLISHED', // STRICT: Only published products appear in public catalog
  };

  // Category filter
  if (params.categorySlug && params.categorySlug !== 'all') {
    where.category = {
      slug: params.categorySlug.toLowerCase().trim(),
      isActive: true,
    };
  }

  // Search filter (searches title and description)
  if (params.search && params.search.trim().length > 0) {
    const term = params.search.trim();
    where.OR = [
      { title: { contains: term } },
      { description: { contains: term } },
    ];
  }

  // Price range filters
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.regularPrice = {};
    if (params.minPrice !== undefined && !isNaN(params.minPrice)) {
      where.regularPrice.gte = Number(params.minPrice);
    }
    if (params.maxPrice !== undefined && !isNaN(params.maxPrice)) {
      where.regularPrice.lte = Number(params.maxPrice);
    }
  }

  // Variant-level filters (size, color, in-stock)
  const variantConditions: Prisma.ProductVariantWhereInput = {};
  if (params.size && params.size !== 'all') {
    variantConditions.size = { equals: params.size };
  }
  if (params.color && params.color !== 'all') {
    variantConditions.color = { equals: params.color };
  }
  if (params.inStockOnly) {
    variantConditions.inventoryCount = { gt: 0 };
    variantConditions.isAvailable = true;
  }

  if (Object.keys(variantConditions).length > 0) {
    where.variants = {
      some: variantConditions,
    };
  }

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (params.sort === 'price-asc') {
    orderBy = { regularPrice: 'asc' };
  } else if (params.sort === 'price-desc') {
    orderBy = { regularPrice: 'desc' };
  } else if (params.sort === 'popular') {
    orderBy = { isFeatured: 'desc' };
  } else {
    // Default 'newest'
    orderBy = { createdAt: 'desc' };
  }

  // Execute count and data query in parallel avoiding N+1
  const [totalCount, rawProducts, allPublishedVariants] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 2,
        },
        variants: {
          select: {
            id: true,
            size: true,
            color: true,
            inventoryCount: true,
            isAvailable: true,
          },
        },
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    }),
    // Facet extraction across all published products
    db.productVariant.findMany({
      where: {
        product: { status: 'PUBLISHED' },
      },
      select: {
        size: true,
        color: true,
      },
      distinct: ['size', 'color'],
    }),
  ]);

  // Transform products
  const products: ProductSummary[] = rawProducts.map((p) => {
    // Calculate legitimate discount percentage only if valid
    let discountPercentage: number | null = null;
    if (p.salePrice && p.salePrice < p.regularPrice) {
      discountPercentage = Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100);
    }

    // Available sizes and colors
    const sizes = Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean) as string[]));
    const colors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean) as string[]));
    const totalStock = p.variants.reduce((acc, v) => acc + v.inventoryCount, 0);
    const isAvailable = totalStock > 0 && p.variants.some((v) => v.isAvailable);

    // Review averages
    const reviewCount = p.reviews.length;
    const averageRating =
      reviewCount > 0
        ? Number((p.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
        : null;

    const primaryImage = p.images[0]
      ? { url: p.images[0].url, altText: p.images[0].altText }
      : null;

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      description: p.description,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      discountPercentage,
      isFeatured: p.isFeatured,
      category: p.category,
      primaryImage,
      availableSizes: sizes,
      availableColors: colors,
      totalStock,
      isAvailable,
      averageRating,
      reviewCount,
    };
  });

  // Extract distinct available sizes and colors for filters
  const facetSizes = Array.from(new Set(allPublishedVariants.map((v) => v.size).filter(Boolean) as string[])).sort();
  const facetColors = Array.from(new Set(allPublishedVariants.map((v) => v.color).filter(Boolean) as string[])).sort();

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    pageSize,
    facets: {
      sizes: facetSizes,
      colors: facetColors,
    },
  };
}

/**
 * Retrieves a single published product by slug with complete details, gallery, variants, and reviews
 */
export async function getProductBySlug(slug: string) {
  if (!slug || typeof slug !== 'string') return null;

  const product = await db.product.findFirst({
    where: {
      slug: slug.toLowerCase().trim(),
      status: 'PUBLISHED', // Strictly prevents unpublished items
    },
    include: {
      category: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
      variants: {
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
      },
      reviews: {
        where: { isApproved: true }, // Only approved reviews
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!product) return null;

  let discountPercentage: number | null = null;
  if (product.salePrice && product.salePrice < product.regularPrice) {
    discountPercentage = Math.round(
      ((product.regularPrice - product.salePrice) / product.regularPrice) * 100
    );
  }

  const totalStock = product.variants.reduce((acc, v) => acc + v.inventoryCount, 0);

  const reviewCount = product.reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number((product.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
      : null;

  return {
    ...product,
    discountPercentage,
    totalStock,
    isAvailable: totalStock > 0 && product.variants.some((v) => v.isAvailable),
    reviewCount,
    averageRating,
  };
}

/**
 * Retrieves related products in the same category
 */
export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const products = await db.product.findMany({
    where: {
      status: 'PUBLISHED',
      categoryId,
      id: { not: productId },
    },
    take: limit,
    include: {
      category: { select: { name: true, slug: true } },
      images: { take: 1, orderBy: { displayOrder: 'asc' } },
      variants: { select: { inventoryCount: true, isAvailable: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map((p) => {
    let discountPercentage: number | null = null;
    if (p.salePrice && p.salePrice < p.regularPrice) {
      discountPercentage = Math.round(((p.regularPrice - p.salePrice) / p.regularPrice) * 100);
    }
    const totalStock = p.variants.reduce((acc, v) => acc + v.inventoryCount, 0);

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice,
      discountPercentage,
      category: p.category,
      imageUrl: p.images[0]?.url || null,
      altText: p.images[0]?.altText || p.title,
      isAvailable: totalStock > 0,
    };
  });
}
