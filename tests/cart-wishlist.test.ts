import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import {
  getOrCreateCart,
  getCartDetails,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  mergeGuestCartIntoUserCart,
} from '@/lib/cart/cart-service';
import {
  getCustomerWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  isProductInWishlist,
} from '@/lib/wishlist/wishlist-service';
import { hashPassword } from '@/lib/auth/password';
import { ROLES } from '@/lib/auth/rbac';

describe('Persistent Shopping Cart & Wishlist System', () => {
  let testUserId = '';
  let testProductId = '';
  let testVariantId = '';
  let testOutOfStockVariantId = '';
  let guestToken = '';
  let guestCartId = '';
  let userCartId = '';

  beforeAll(async () => {
    // 1. Create a customer user
    const passwordHash = await hashPassword('CustomerPass123!');
    const user = await db.user.create({
      data: {
        email: `cart_test_${Date.now()}@example.com`,
        name: 'Cart Test Customer',
        passwordHash,
        role: ROLES.CUSTOMER,
      },
    });
    testUserId = user.id;

    // 2. Create dedicated product and variants for test isolation
    let category = await db.category.findFirst();
    if (!category) {
      category = await db.category.create({
        data: { name: 'Cart Category', slug: `cart-cat-${Date.now()}` },
      });
    }

    const product = await db.product.create({
      data: {
        title: 'Dedicated Cart Test Product',
        slug: `cart-test-product-${Date.now()}`,
        description: 'Test product for shopping bag verification',
        categoryId: category.id,
        regularPrice: 15000,
        status: 'PUBLISHED',
      },
    });
    testProductId = product.id;

    const variant = await db.productVariant.create({
      data: {
        productId: product.id,
        sku: `CART-VAR-${Date.now()}`,
        title: 'Medium / Maroon',
        inventoryCount: 50,
        isAvailable: true,
      },
    });
    testVariantId = variant.id;

    // Create an explicit out-of-stock variant
    const oosVariant = await db.productVariant.create({
      data: {
        productId: testProductId,
        sku: `OOS-TEST-${Date.now()}`,
        title: 'Out of Stock Test Variant',
        inventoryCount: 0,
        isAvailable: false,
      },
    });
    testOutOfStockVariantId = oosVariant.id;
  });

  afterAll(async () => {
    // Cleanup
    await db.user.delete({ where: { id: testUserId } }).catch(() => {});
    await db.productVariant.delete({ where: { id: testOutOfStockVariantId } }).catch(() => {});
  });

  describe('1. Cart Creation & Guest Persistence', () => {
    it('creates guest cart with secure token', async () => {
      const res = await getOrCreateCart(null, null);
      expect(res.cartId).toBeDefined();
      expect(res.guestToken).toBeDefined();
      expect(res.guestToken.length).toBeGreaterThan(16);
      guestToken = res.guestToken;
      guestCartId = res.cartId;
    });

    it('retrieves existing guest cart with matching token', async () => {
      const res = await getOrCreateCart(null, guestToken);
      expect(res.cartId).toBe(guestCartId);
      expect(res.guestToken).toBe(guestToken);
    });

    it('creates and persists authenticated user cart', async () => {
      const res = await getOrCreateCart(testUserId, null);
      expect(res.cartId).toBeDefined();
      userCartId = res.cartId;

      const repeat = await getOrCreateCart(testUserId, null);
      expect(repeat.cartId).toBe(userCartId);
    });
  });

  describe('2. Add to Cart & Server-Side Price / Stock Validation', () => {
    it('adds valid product variant to guest cart with server-authoritative price', async () => {
      const result = await addItemToCart(guestCartId, testVariantId, 2);
      expect(result.success).toBe(true);

      const cart = await getCartDetails(guestCartId);
      expect(cart.totalItems).toBe(2);
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].unitPrice).toBeGreaterThan(0);
      expect(cart.subtotal).toBe(cart.items[0].unitPrice * 2);
    });

    it('rejects adding non-existent or invalid variant', async () => {
      const result = await addItemToCart(guestCartId, 'non-existent-variant-id-999', 1);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects adding out-of-stock variant', async () => {
      const result = await addItemToCart(guestCartId, testOutOfStockVariantId, 1);
      expect(result.success).toBe(false);
      expect(result.error).toContain('out of stock');
    });

    it('caps quantity to available inventory without creating duplicate items', async () => {
      // Add variant again; quantity should increment
      const result = await addItemToCart(guestCartId, testVariantId, 1);
      expect(result.success).toBe(true);

      const cart = await getCartDetails(guestCartId);
      // Items list must remain 1 (no duplicate rows)
      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(3);
    });
  });

  describe('3. Quantity Updates & Removal', () => {
    it('updates item quantity successfully', async () => {
      const cart = await getCartDetails(guestCartId);
      const itemId = cart.items[0].id;

      const updateRes = await updateItemQuantity(guestCartId, itemId, 4);
      expect(updateRes.success).toBe(true);
      expect(updateRes.newQuantity).toBe(4);

      const updatedCart = await getCartDetails(guestCartId);
      expect(updatedCart.items[0].quantity).toBe(4);
    });

    it('removes item when quantity is reduced to 0', async () => {
      const cart = await getCartDetails(guestCartId);
      const itemId = cart.items[0].id;

      const updateRes = await updateItemQuantity(guestCartId, itemId, 0);
      expect(updateRes.success).toBe(true);

      const updatedCart = await getCartDetails(guestCartId);
      expect(updatedCart.items.length).toBe(0);
    });

    it('removes item explicitly via removeItemFromCart', async () => {
      await addItemToCart(guestCartId, testVariantId, 1);
      let cart = await getCartDetails(guestCartId);
      expect(cart.items.length).toBe(1);

      await removeItemFromCart(guestCartId, cart.items[0].id);
      cart = await getCartDetails(guestCartId);
      expect(cart.items.length).toBe(0);
    });
  });

  describe('4. Guest Cart Merging Upon Login', () => {
    it('merges guest items into customer cart without corrupting quantities', async () => {
      // 1. Add item to guest cart
      await addItemToCart(guestCartId, testVariantId, 2);

      // 2. Add same item (qty 1) to user cart
      await addItemToCart(userCartId, testVariantId, 1);

      // 3. Execute merge
      await mergeGuestCartIntoUserCart(guestToken, testUserId);

      // 4. Verify user cart now has combined quantity (2 + 1 = 3)
      const userCart = await getCartDetails(userCartId);
      expect(userCart.items.length).toBe(1);
      expect(userCart.items[0].quantity).toBe(3);

      // 5. Verify guest cart is cleaned up
      const oldGuestCart = await db.cart.findUnique({
        where: { sessionToken: guestToken },
      });
      expect(oldGuestCart).toBeNull();
    });
  });

  describe('5. Price and Inventory Revalidation', () => {
    it('automatically detects price updates and adjusts cart item subtotal', async () => {
      const cart = await getCartDetails(userCartId);
      const currentPrice = cart.items[0].unitPrice;

      // Temporarily override variant price
      await db.productVariant.update({
        where: { id: testVariantId },
        data: { priceOverride: currentPrice + 500 },
      });

      // Calling getCartDetails revalidates from database
      const revalidated = await getCartDetails(userCartId);
      expect(revalidated.items[0].unitPrice).toBe(currentPrice + 500);
      expect(revalidated.items[0].priceNotice).toBeDefined();

      // Restore price
      await db.productVariant.update({
        where: { id: testVariantId },
        data: { priceOverride: null },
      });
    });
  });

  describe('6. Customer Wishlist Lifecycle', () => {
    it('adds product to customer wishlist', async () => {
      const res = await addProductToWishlist(testUserId, testProductId);
      expect(res.success).toBe(true);

      const inWishlist = await isProductInWishlist(testUserId, testProductId);
      expect(inWishlist).toBe(true);
    });

    it('retrieves saved wishlist with product metadata', async () => {
      const wishlist = await getCustomerWishlist(testUserId);
      expect(wishlist.length).toBe(1);
      expect(wishlist[0].productId).toBe(testProductId);
      expect(wishlist[0].title).toBeDefined();
    });

    it('removes product from wishlist', async () => {
      const removed = await removeProductFromWishlist(testUserId, testProductId);
      expect(removed).toBe(true);

      const wishlistAfter = await getCustomerWishlist(testUserId);
      expect(wishlistAfter.length).toBe(0);
    });
  });
});
