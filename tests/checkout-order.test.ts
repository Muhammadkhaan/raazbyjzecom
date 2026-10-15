import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import {
  calculateOrderTotals,
  processCheckout,
  getOrderConfirmation,
  validateAddress,
} from '@/lib/checkout/checkout-service';
import { getOrCreateCart, addItemToCart } from '@/lib/cart/cart-service';
import { StripePaymentAdapter } from '@/lib/payments/stripe-adapter';
import { hashPassword } from '@/lib/auth/password';
import { ROLES } from '@/lib/auth/rbac';
import { createHmac } from 'crypto';

describe('Checkout & Order Processing Workflow Suite', () => {
  let customer1Id = '';
  let customer2Id = '';
  let cartId = '';
  let testVariantId = '';
  let initialStock = 0;
  let testProductPrice = 0;

  beforeAll(async () => {
    // 1. Create two test customers
    const hash = await hashPassword('Password123!');
    const u1 = await db.user.create({
      data: {
        email: `buyer1_${Date.now()}@example.com`,
        name: 'Buyer One',
        passwordHash: hash,
        role: ROLES.CUSTOMER,
      },
    });
    customer1Id = u1.id;

    const u2 = await db.user.create({
      data: {
        email: `buyer2_${Date.now()}@example.com`,
        name: 'Buyer Two',
        passwordHash: hash,
        role: ROLES.CUSTOMER,
      },
    });
    customer2Id = u2.id;

    // 2. Create dedicated product with stock for checkout suite
    let category = await db.category.findFirst();
    if (!category) {
      category = await db.category.create({
        data: { name: 'Checkout Category', slug: `checkout-cat-${Date.now()}` },
      });
    }

    const product = await db.product.create({
      data: {
        title: 'Dedicated Checkout Product',
        slug: `checkout-product-${Date.now()}`,
        description: 'Testing checkout processing and inventory deduction',
        categoryId: category.id,
        regularPrice: 20000,
        status: 'PUBLISHED',
      },
    });

    initialStock = 20;
    testProductPrice = 20000;

    const variant = await db.productVariant.create({
      data: {
        productId: product.id,
        sku: `CHK-VAR-${Date.now()}`,
        title: 'Large / Emerald',
        inventoryCount: initialStock,
        isAvailable: true,
      },
    });
    testVariantId = variant.id;

    // 3. Setup Cart
    const cartRes = await getOrCreateCart(customer1Id, null);
    cartId = cartRes.cartId;
    await addItemToCart(cartId, testVariantId, 2);
  });

  afterAll(async () => {
    // Cleanup
    await db.user.deleteMany({
      where: { id: { in: [customer1Id, customer2Id] } },
    }).catch(() => {});
  });

  describe('1. Address & Input Validation', () => {
    it('validates a complete, compliant Pakistani delivery address', () => {
      const valid = validateAddress({
        recipientName: 'Fatima Ali',
        phone: '03001234567',
        street: 'Apartment 4B, Emerald Tower, Clifton',
        city: 'Karachi',
        postalCode: '75500',
        country: 'Pakistan',
      });
      expect(valid.isValid).toBe(true);
    });

    it('rejects incomplete address with missing fields', () => {
      const invalid = validateAddress({
        recipientName: '',
        phone: '',
        street: 'X',
        city: '',
        postalCode: '',
        country: 'Pakistan',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.error).toBeDefined();
    });
  });

  describe('2. Order Calculation & Coupon Application', () => {
    it('calculates subtotal, shipping fee, and grand total correctly', async () => {
      const res = await calculateOrderTotals({
        cartId,
        shippingMethodCode: 'STANDARD',
      });

      expect(res.success).toBe(true);
      expect(res.calculation).toBeDefined();
      expect(res.calculation?.subtotal).toBe(testProductPrice * 2);
      expect(res.calculation?.grandTotal).toBe(
        res.calculation!.subtotal + res.calculation!.shippingTotal - res.calculation!.discountTotal
      );
    });

    it('applies valid promotion coupon and deducts discount', async () => {
      const res = await calculateOrderTotals({
        cartId,
        shippingMethodCode: 'STANDARD',
        couponCode: 'WELCOME10',
      });

      expect(res.success).toBe(true);
      if (res.calculation && res.calculation.subtotal >= 5000) {
        expect(res.calculation.discountTotal).toBeGreaterThan(0);
        expect(res.calculation.coupon?.code).toBe('WELCOME10');
      }
    });
  });

  describe('3. Order Creation & Inventory Transaction', () => {
    let placedOrderNumber = '';

    it('places a Cash on Delivery order atomically, deducting stock and creating snapshots', async () => {
      const checkoutRes = await processCheckout({
        cartId,
        userId: customer1Id,
        customerEmail: 'buyer1@example.com',
        customerPhone: '03009876543',
        shippingAddress: {
          recipientName: 'Buyer One',
          phone: '03009876543',
          street: 'Plot 12, Main Boulevard, Gulberg',
          city: 'Lahore',
          postalCode: '54000',
          country: 'Pakistan',
        },
        shippingMethodCode: 'STANDARD',
        paymentMethod: 'CASH_ON_DELIVERY',
      });

      expect(checkoutRes.success).toBe(true);
      expect(checkoutRes.order).toBeDefined();
      expect(checkoutRes.order?.orderNumber).toMatch(/^LM-/);
      expect(checkoutRes.order?.paymentStatus).toBe('PENDING');

      placedOrderNumber = checkoutRes.order!.orderNumber;

      // Verify stock was deducted in database (initialStock - 2)
      const variantAfter = await db.productVariant.findUnique({
        where: { id: testVariantId },
      });
      expect(variantAfter?.inventoryCount).toBe(initialStock - 2);

      // Verify cart was cleared
      const cartAfter = await db.cartItem.findMany({
        where: { cartId },
      });
      expect(cartAfter.length).toBe(0);
    });

    it('prevents overselling when requested quantity exceeds available stock', async () => {
      // Setup cart with high quantity
      await addItemToCart(cartId, testVariantId, 1);

      // Artificially deplete stock in DB
      await db.productVariant.update({
        where: { id: testVariantId },
        data: { inventoryCount: 0 },
      });

      const failedOrder = await processCheckout({
        cartId,
        userId: customer1Id,
        customerEmail: 'buyer1@example.com',
        customerPhone: '03009876543',
        shippingAddress: {
          recipientName: 'Buyer One',
          phone: '03009876543',
          street: 'Plot 12, Main Boulevard, Gulberg',
          city: 'Lahore',
          postalCode: '54000',
          country: 'Pakistan',
        },
        shippingMethodCode: 'STANDARD',
        paymentMethod: 'CASH_ON_DELIVERY',
      });

      expect(failedOrder.success).toBe(false);
      expect(failedOrder.error).toMatch(/unavailable|stock/i);

      // Restore stock
      await db.productVariant.update({
        where: { id: testVariantId },
        data: { inventoryCount: initialStock },
      });
    });

    it('retrieves confirmed order snapshot with access control', async () => {
      // Owner can view order
      const order = await getOrderConfirmation(placedOrderNumber, customer1Id);
      expect(order).not.toBeNull();
      expect(order?.orderNumber).toBe(placedOrderNumber);
      expect(order?.items.length).toBeGreaterThan(0);

      // Different customer CANNOT view order (access control rule)
      const unauthorized = await getOrderConfirmation(placedOrderNumber, customer2Id);
      expect(unauthorized).toBeNull();
    });
  });

  describe('4. Webhook Cryptographic Verification & Idempotency', () => {
    const testSecret = 'whsec_test_secret_for_suite_12345';
    const adapter = new StripePaymentAdapter();

    it('verifies valid HMAC-SHA256 signature and rejects forged payloads', async () => {
      process.env.STRIPE_WEBHOOK_SECRET = testSecret;

      const orderNum = `LM-TEST-${Date.now()}`;
      const payload = JSON.stringify({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_12345678',
            metadata: { orderNumber: orderNum },
          },
        },
      });

      const timestamp = Math.floor(Date.now() / 1000);
      const signature = createHmac('sha256', testSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      const validHeader = `t=${timestamp},v1=${signature}`;

      // Valid signature check
      const result = await adapter.verifyWebhook!(payload, validHeader);
      expect(result.verified).toBe(true);
      expect(result.status).toBe('COMPLETED');
      expect(result.orderNumber).toBe(orderNum);

      // Forged signature check
      const forgedHeader = `t=${timestamp},v1=invalid_tampered_signature_hex`;
      const forgedResult = await adapter.verifyWebhook!(payload, forgedHeader);
      expect(forgedResult.verified).toBe(false);
    });
  });
});
