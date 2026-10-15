import { db } from '@/lib/db';
import { randomBytes } from 'crypto';

export const GUEST_CART_COOKIE_NAME = 'laam_guest_cart_token';

export interface CartItemDetail {
  id: string;
  variantId: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  variantTitle: string;
  size: string | null;
  color: string | null;
  sku: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl: string | null;
  imageAlt: string;
  inventoryCount: number;
  isAvailable: boolean;
  isLowStock: boolean;
  priceNotice?: string;
  stockNotice?: string;
}

export interface CartDetails {
  id: string;
  userId: string | null;
  items: CartItemDetail[];
  totalItems: number;
  subtotal: number;
  shippingEstimate: number;
  grandTotal: number;
  hasUnavailableItems: boolean;
  warnings: string[];
}

/**
 * Generates a secure random token for guest carts
 */
export function generateGuestToken(): string {
  return randomBytes(24).toString('hex');
}

/**
 * Finds or creates a cart record for an authenticated user or a guest session
 */
export async function getOrCreateCart(
  userId?: string | null,
  guestToken?: string | null
): Promise<{ cartId: string; guestToken: string }> {
  // 1. Authenticated User Cart
  if (userId) {
    let userCart = await db.cart.findUnique({
      where: { userId },
    });

    if (!userCart) {
      userCart = await db.cart.create({
        data: {
          userId,
        },
      });
    }

    return { cartId: userCart.id, guestToken: '' };
  }

  // 2. Guest Cart
  let effectiveToken = guestToken?.trim() || '';

  if (effectiveToken) {
    const existingGuestCart = await db.cart.findUnique({
      where: { sessionToken: effectiveToken },
    });

    if (existingGuestCart) {
      return { cartId: existingGuestCart.id, guestToken: effectiveToken };
    }
  }

  // Generate new guest token and cart
  effectiveToken = generateGuestToken();
  const newGuestCart = await db.cart.create({
    data: {
      sessionToken: effectiveToken,
    },
  });

  return { cartId: newGuestCart.id, guestToken: effectiveToken };
}

/**
 * Retrieves full cart details with server-side price, variant, and stock revalidation.
 * The browser is NEVER authoritative for prices, discounts, or inventory.
 */
export async function getCartDetails(cartId: string): Promise<CartDetails> {
  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { displayOrder: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      id: cartId,
      userId: null,
      items: [],
      totalItems: 0,
      subtotal: 0,
      shippingEstimate: 0,
      grandTotal: 0,
      hasUnavailableItems: false,
      warnings: [],
    };
  }

  const warnings: string[] = [];
  const validItems: CartItemDetail[] = [];
  const itemsToDelete: string[] = [];

  for (const item of cart.items) {
    const variant = item.variant;
    const product = variant?.product;

    // 1. If variant or product was deleted or unpublished: remove or flag
    if (!variant || !product || product.status !== 'PUBLISHED') {
      itemsToDelete.push(item.id);
      warnings.push(`An item previously in your bag is no longer available and was removed.`);
      continue;
    }

    // 2. Server-Authoritative Price
    const authoritativePrice =
      variant.priceOverride ?? (product.salePrice ?? product.regularPrice);

    // If recorded unitPrice differs from current live price, update database
    let priceNotice: string | undefined;
    if (Math.abs(item.unitPrice - authoritativePrice) > 0.01) {
      await db.cartItem.update({
        where: { id: item.id },
        data: { unitPrice: authoritativePrice },
      });
      priceNotice = `Price updated from ${item.unitPrice} to ${authoritativePrice}`;
      warnings.push(`The price for "${product.title}" has been updated.`);
    }

    // 3. Stock & Availability Check
    let effectiveQuantity = item.quantity;
    let stockNotice: string | undefined;
    const isAvailable = variant.isAvailable && variant.inventoryCount > 0;

    if (!isAvailable) {
      stockNotice = 'Item is currently sold out.';
    } else if (item.quantity > variant.inventoryCount) {
      // Clamp quantity to maximum available stock
      effectiveQuantity = variant.inventoryCount;
      await db.cartItem.update({
        where: { id: item.id },
        data: { quantity: effectiveQuantity },
      });
      stockNotice = `Quantity reduced to ${effectiveQuantity} based on available stock.`;
      warnings.push(`Only ${effectiveQuantity} units of "${product.title}" are available.`);
    }

    const itemSubtotal = authoritativePrice * effectiveQuantity;

    validItems.push({
      id: item.id,
      variantId: variant.id,
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      variantTitle: variant.title,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      unitPrice: authoritativePrice,
      originalPrice: product.regularPrice,
      quantity: effectiveQuantity,
      subtotal: itemSubtotal,
      imageUrl: product.images[0]?.url || null,
      imageAlt: product.images[0]?.altText || product.title,
      inventoryCount: variant.inventoryCount,
      isAvailable,
      isLowStock: isAvailable && variant.inventoryCount <= 5,
      priceNotice,
      stockNotice,
    });
  }

  // Cleanup invalidated items in background
  if (itemsToDelete.length > 0) {
    await db.cartItem.deleteMany({
      where: { id: { in: itemsToDelete } },
    }).catch(() => {});
  }

  const totalItems = validItems.reduce((acc, i) => acc + (i.isAvailable ? i.quantity : 0), 0);
  const subtotal = validItems.reduce((acc, i) => acc + (i.isAvailable ? i.subtotal : 0), 0);
  const shippingEstimate = subtotal > 10000 || subtotal === 0 ? 0 : 250; // Free shipping over PKR 10,000
  const grandTotal = subtotal + shippingEstimate;
  const hasUnavailableItems = validItems.some((i) => !i.isAvailable);

  return {
    id: cart.id,
    userId: cart.userId,
    items: validItems,
    totalItems,
    subtotal,
    shippingEstimate,
    grandTotal,
    hasUnavailableItems,
    warnings,
  };
}

/**
 * Adds an item to the cart using server-side validation and atomic database transaction.
 */
export async function addItemToCart(
  cartId: string,
  variantId: string,
  quantityToAdd: number
): Promise<{ success: boolean; error?: string; warning?: string }> {
  if (quantityToAdd < 1 || !Number.isInteger(quantityToAdd)) {
    return { success: false, error: 'Quantity must be a positive integer.' };
  }

  // Fetch variant and product from database to verify status, price, and stock
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  });

  if (!variant || !variant.product) {
    return { success: false, error: 'Selected product variant was not found.' };
  }

  if (variant.product.status !== 'PUBLISHED') {
    return { success: false, error: 'This product is not currently available for purchase.' };
  }

  if (!variant.isAvailable || variant.inventoryCount <= 0) {
    return { success: false, error: 'This item variation is out of stock.' };
  }

  const authoritativePrice =
    variant.priceOverride ?? (variant.product.salePrice ?? variant.product.regularPrice);

  return db.$transaction(async (tx) => {
    // Check if item is already in cart
    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId,
          variantId,
        },
      },
    });

    const targetQuantity = (existing ? existing.quantity : 0) + quantityToAdd;

    // Check inventory ceiling
    let finalQuantity = targetQuantity;
    let warning: string | undefined;

    if (targetQuantity > variant.inventoryCount) {
      finalQuantity = variant.inventoryCount;
      warning = `Max stock reached. Quantity adjusted to ${finalQuantity}.`;
    }

    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: finalQuantity,
          unitPrice: authoritativePrice,
        },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId,
          variantId,
          quantity: finalQuantity,
          unitPrice: authoritativePrice,
        },
      });
    }

    return { success: true, warning };
  });
}

/**
 * Updates item quantity in the cart with stock constraints.
 */
export async function updateItemQuantity(
  cartId: string,
  cartItemId: string,
  newQuantity: number
): Promise<{ success: boolean; newQuantity: number; error?: string; warning?: string }> {
  if (newQuantity < 1) {
    // If quantity is 0 or negative, remove the item
    await removeItemFromCart(cartId, cartItemId);
    return { success: true, newQuantity: 0 };
  }

  const item = await db.cartItem.findFirst({
    where: { id: cartItemId, cartId },
    include: { variant: true },
  });

  if (!item) {
    return { success: false, newQuantity: 0, error: 'Cart item not found.' };
  }

  let finalQuantity = Math.min(newQuantity, 99);
  let warning: string | undefined;

  if (finalQuantity > item.variant.inventoryCount) {
    finalQuantity = item.variant.inventoryCount;
    warning = `Only ${finalQuantity} available in stock.`;
  }

  await db.cartItem.update({
    where: { id: item.id },
    data: { quantity: finalQuantity },
  });

  return { success: true, newQuantity: finalQuantity, warning };
}

/**
 * Removes an item from the cart.
 */
export async function removeItemFromCart(cartId: string, cartItemId: string): Promise<boolean> {
  const result = await db.cartItem.deleteMany({
    where: { id: cartItemId, cartId },
  });
  return result.count > 0;
}

/**
 * Clears all items in the cart.
 */
export async function clearCart(cartId: string): Promise<void> {
  await db.cartItem.deleteMany({
    where: { cartId },
  });
}

/**
 * Merges guest cart items into customer cart after login without duplicating or corrupting quantities.
 */
export async function mergeGuestCartIntoUserCart(
  guestToken: string,
  userId: string
): Promise<void> {
  if (!guestToken || !userId) return;

  const guestCart = await db.cart.findUnique({
    where: { sessionToken: guestToken },
    include: { items: true },
  });

  if (!guestCart || guestCart.items.length === 0) return;

  // Ensure user cart exists
  let userCart = await db.cart.findUnique({
    where: { userId },
  });

  if (!userCart) {
    userCart = await db.cart.create({
      data: { userId },
    });
  }

  // Merge items atomically in transaction
  await db.$transaction(async (tx) => {
    for (const guestItem of guestCart.items) {
      // Fetch variant stock
      const variant = await tx.productVariant.findUnique({
        where: { id: guestItem.variantId },
      });

      if (!variant || !variant.isAvailable || variant.inventoryCount <= 0) {
        continue; // Skip out-of-stock items
      }

      const existingUserItem = await tx.cartItem.findUnique({
        where: {
          cartId_variantId: {
            cartId: userCart!.id,
            variantId: guestItem.variantId,
          },
        },
      });

      if (existingUserItem) {
        // Add quantities, capped at stock
        const combinedQty = Math.min(
          existingUserItem.quantity + guestItem.quantity,
          variant.inventoryCount
        );

        await tx.cartItem.update({
          where: { id: existingUserItem.id },
          data: {
            quantity: combinedQty,
            unitPrice: guestItem.unitPrice,
          },
        });
      } else {
        const cappedQty = Math.min(guestItem.quantity, variant.inventoryCount);
        await tx.cartItem.create({
          data: {
            cartId: userCart!.id,
            variantId: guestItem.variantId,
            quantity: cappedQty,
            unitPrice: guestItem.unitPrice,
          },
        });
      }
    }

    // Clean up guest cart items and guest cart
    await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}
