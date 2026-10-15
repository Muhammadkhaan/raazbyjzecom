import { db } from '@/lib/db';

export interface WishlistItemDetail {
  id: string;
  productId: string;
  title: string;
  slug: string;
  categoryName: string;
  regularPrice: number;
  salePrice: number | null;
  discountPercentage: number | null;
  imageUrl: string | null;
  imageAlt: string;
  isAvailable: boolean;
  totalStock: number;
}

/**
 * Finds or creates a customer wishlist record
 */
export async function getOrCreateWishlist(userId: string) {
  let wishlist = await db.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) {
    wishlist = await db.wishlist.create({
      data: { userId },
    });
  }

  return wishlist;
}

/**
 * Retrieves wishlist products for a customer.
 * Gracefully handles deleted, unpublished, or unavailable products.
 */
export async function getCustomerWishlist(userId: string): Promise<WishlistItemDetail[]> {
  const wishlist = await db.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: { select: { name: true } },
              images: { take: 1, orderBy: { displayOrder: 'asc' } },
              variants: { select: { inventoryCount: true, isAvailable: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!wishlist) return [];

  const validItems: WishlistItemDetail[] = [];
  const itemsToDelete: string[] = [];

  for (const item of wishlist.items) {
    const product = item.product;

    // Gracefully handle deleted or unpublished products
    if (!product || product.status !== 'PUBLISHED') {
      itemsToDelete.push(item.id);
      continue;
    }

    let discountPercentage: number | null = null;
    if (product.salePrice && product.salePrice < product.regularPrice) {
      discountPercentage = Math.round(
        ((product.regularPrice - product.salePrice) / product.regularPrice) * 100
      );
    }

    const totalStock = product.variants.reduce((acc, v) => acc + v.inventoryCount, 0);
    const isAvailable = totalStock > 0 && product.variants.some((v) => v.isAvailable);

    validItems.push({
      id: item.id,
      productId: product.id,
      title: product.title,
      slug: product.slug,
      categoryName: product.category.name,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
      discountPercentage,
      imageUrl: product.images[0]?.url || null,
      imageAlt: product.images[0]?.altText || product.title,
      isAvailable,
      totalStock,
    });
  }

  // Background cleanup of removed/unpublished items
  if (itemsToDelete.length > 0) {
    await db.wishlistItem.deleteMany({
      where: { id: { in: itemsToDelete } },
    }).catch(() => {});
  }

  return validItems;
}

/**
 * Adds a product to customer wishlist
 */
export async function addProductToWishlist(
  userId: string,
  productId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate product exists and is published
  const product = await db.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.status !== 'PUBLISHED') {
    return { success: false, error: 'Product not found or unavailable.' };
  }

  const wishlist = await getOrCreateWishlist(userId);

  await db.wishlistItem.upsert({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
    update: {},
    create: {
      wishlistId: wishlist.id,
      productId,
    },
  });

  return { success: true };
}

/**
 * Removes a product from customer wishlist
 */
export async function removeProductFromWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const wishlist = await db.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) return false;

  const result = await db.wishlistItem.deleteMany({
    where: {
      wishlistId: wishlist.id,
      productId,
    },
  });

  return result.count > 0;
}

/**
 * Checks if a product is in customer wishlist
 */
export async function isProductInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const wishlist = await db.wishlist.findUnique({
    where: { userId },
  });

  if (!wishlist) return false;

  const item = await db.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
  });

  return Boolean(item);
}

/**
 * Merges guest wishlist product IDs into customer wishlist upon login
 */
export async function mergeGuestWishlist(userId: string, productIds: string[]) {
  if (!productIds || productIds.length === 0) return;

  const wishlist = await getOrCreateWishlist(userId);

  for (const pid of productIds) {
    const product = await db.product.findUnique({
      where: { id: pid },
    });
    if (product && product.status === 'PUBLISHED') {
      await db.wishlistItem.upsert({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId: pid,
          },
        },
        update: {},
        create: {
          wishlistId: wishlist.id,
          productId: pid,
        },
      });
    }
  }
}
