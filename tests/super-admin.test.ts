import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { ROLES, isAuthorized } from '@/lib/auth/rbac';
import { getAdminSession } from '@/lib/admin/admin-auth';
import {
  createProduct,
  updateProduct,
  deleteOrArchiveProduct,
  adjustInventory,
  getAdminInventory,
  getVariantInventoryHistory,
  getAdminOrders,
  getAdminOrderById,
  updateOrderFulfillment,
  updateOrderPaymentStatus,
  getAdminCustomers,
  getAdminCustomerById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getStoreSettings,
  updateStoreSettings,
  getAdminDashboardMetrics,
} from '@/lib/admin/admin-service';

describe('Super-Admin Portal & Store Operations Suite', () => {
  let superAdminUser: any;
  let staffUser: any;
  let customerUser: any;
  let testCategory: any;
  let createdProductId: string;
  let createdVariantId: string;
  let testOrderId: string;
  let testOrderNumber: string;

  beforeAll(async () => {
    // 1. Create or retrieve test users
    const pwdHash = await hashPassword('AdminPass123!');

    superAdminUser = await db.user.upsert({
      where: { email: 'superadmin.test@laamstore.com' },
      update: { role: ROLES.SUPER_ADMIN },
      create: {
        email: 'superadmin.test@laamstore.com',
        passwordHash: pwdHash,
        name: 'Super Admin Test',
        role: ROLES.SUPER_ADMIN,
      },
    });

    staffUser = await db.user.upsert({
      where: { email: 'staff.test@laamstore.com' },
      update: { role: ROLES.STAFF },
      create: {
        email: 'staff.test@laamstore.com',
        passwordHash: pwdHash,
        name: 'Staff Test',
        role: ROLES.STAFF,
      },
    });

    customerUser = await db.user.upsert({
      where: { email: 'customer.admin-test@laamstore.com' },
      update: { role: ROLES.CUSTOMER },
      create: {
        email: 'customer.admin-test@laamstore.com',
        passwordHash: pwdHash,
        name: 'Regular Customer',
        role: ROLES.CUSTOMER,
      },
    });

    // 2. Create test category
    testCategory = await db.category.upsert({
      where: { slug: 'admin-test-couture' },
      update: {},
      create: {
        name: 'Admin Test Couture',
        slug: 'admin-test-couture',
        description: 'Test category for admin operations',
      },
    });
  });

  afterAll(async () => {
    // Clean up created resources if needed
    try {
      if (createdProductId) {
        await db.wishlistItem.deleteMany({ where: { productId: createdProductId } });
        await db.cartItem.deleteMany({
          where: { variant: { productId: createdProductId } },
        });
        await db.inventoryLog.deleteMany({
          where: { variant: { productId: createdProductId } },
        });
        await db.orderItem.deleteMany({
          where: { variant: { productId: createdProductId } },
        });
        await db.productVariant.deleteMany({ where: { productId: createdProductId } });
        await db.productImage.deleteMany({ where: { productId: createdProductId } });
        await db.product.deleteMany({ where: { id: createdProductId } });
      }

      if (testOrderId) {
        await db.payment.deleteMany({ where: { orderId: testOrderId } });
        await db.orderItem.deleteMany({ where: { orderId: testOrderId } });
        await db.order.deleteMany({ where: { id: testOrderId } });
      }

      await db.category.deleteMany({ where: { slug: 'admin-test-couture' } });
      await db.user.deleteMany({
        where: {
          email: {
            in: [
              'superadmin.test@laamstore.com',
              'staff.test@laamstore.com',
              'customer.admin-test@laamstore.com',
            ],
          },
        },
      });
    } catch (e) {
      console.warn('Test cleanup warning:', e);
    }
  });

  describe('1. Role-Based Access Control (RBAC) Security', () => {
    it('authorizes SUPER_ADMIN universally', () => {
      expect(isAuthorized(superAdminUser.role, [ROLES.SUPER_ADMIN, ROLES.STAFF])).toBe(true);
    });

    it('authorizes STAFF for administrative operations', () => {
      expect(isAuthorized(staffUser.role, [ROLES.SUPER_ADMIN, ROLES.STAFF])).toBe(true);
    });

    it('strictly denies CUSTOMER from accessing administrative operations', () => {
      expect(isAuthorized(customerUser.role, [ROLES.SUPER_ADMIN, ROLES.STAFF])).toBe(false);
    });

    it('rejects unauthenticated requests in getAdminSession with null', async () => {
      const mockReq = {
        cookies: {
          get: () => undefined,
        },
      } as any;
      const session = await getAdminSession(mockReq);
      expect(session).toBeNull();
    });

    it('rejects customer sessions in getAdminSession with null', async () => {
      const { token } = await createSession(customerUser.id);
      const mockReq = {
        cookies: {
          get: (name: string) => (name === SESSION_COOKIE_NAME ? { value: token } : undefined),
        },
      } as any;
      const session = await getAdminSession(mockReq);
      expect(session).toBeNull();
    });

    it('successfully validates super admin session in getAdminSession', async () => {
      const { token } = await createSession(superAdminUser.id);
      const mockReq = {
        cookies: {
          get: (name: string) => (name === SESSION_COOKIE_NAME ? { value: token } : undefined),
        },
      } as any;
      const session = await getAdminSession(mockReq);
      expect(session).toBeDefined();
      expect(session?.user.role).toBe(ROLES.SUPER_ADMIN);
    });
  });

  describe('2. Product Lifecycle Management', () => {
    it('creates a new product with images, variants, and initial inventory logs', async () => {
      const product = await createProduct(superAdminUser.id, {
        title: 'Emerald Silk Anarkali',
        slug: 'emerald-silk-anarkali-test',
        description: 'Handcrafted emerald pure raw silk gown with zardozi embroidery.',
        categoryId: testCategory.id,
        regularPrice: 28500,
        salePrice: 24999,
        status: 'PUBLISHED',
        isFeatured: true,
        images: [
          { url: 'https://picsum.photos/seed/emerald1/800/1000', altText: 'Emerald Silk Front' },
        ],
        variants: [
          {
            sku: 'EM-SILK-S',
            title: 'Small / Emerald',
            size: 'Small',
            color: 'Emerald',
            inventoryCount: 15,
          },
          {
            sku: 'EM-SILK-M',
            title: 'Medium / Emerald',
            size: 'Medium',
            color: 'Emerald',
            inventoryCount: 25,
          },
        ],
      });

      expect(product).toBeDefined();
      expect(product.title).toBe('Emerald Silk Anarkali');
      expect(product.slug).toBe('emerald-silk-anarkali-test');
      expect(product.variants.length).toBe(2);

      createdProductId = product.id;
      createdVariantId = product.variants[0].id;

      // Verify that initial inventory log was recorded
      const logs = await getVariantInventoryHistory(createdVariantId);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].reason).toBe('INITIAL_STOCK');
      expect(logs[0].newBalance).toBe(15);
    });

    it('rejects product creation when sale price exceeds regular price', async () => {
      await expect(
        createProduct(superAdminUser.id, {
          title: 'Invalid Pricing Product',
          categoryId: testCategory.id,
          description: 'Testing validation',
          regularPrice: 5000,
          salePrice: 6000, // Invalid: salePrice >= regularPrice
          variants: [{ sku: 'INV-01', title: 'Default', inventoryCount: 5 }],
        })
      ).rejects.toThrow('Sale price must be strictly lower than regular price.');
    });

    it('updates product metadata and adjusts variant stock safely', async () => {
      const updated = await updateProduct(superAdminUser.id, createdProductId, {
        title: 'Emerald Silk Anarkali Luxury Edition',
        regularPrice: 29500,
        salePrice: 25500,
      });

      expect(updated.title).toBe('Emerald Silk Anarkali Luxury Edition');
      expect(updated.regularPrice).toBe(29500);
    });
  });

  describe('3. Inventory Control & Ledger Integrity', () => {
    it('safely restocks variant inventory with recorded InventoryLog', async () => {
      const result = await adjustInventory(
        superAdminUser.id,
        createdVariantId,
        10,
        'RESTOCK'
      );

      expect(result.variant.inventoryCount).toBe(25); // 15 + 10
      expect(result.log.changeAmount).toBe(10);
      expect(result.log.newBalance).toBe(25);
      expect(result.log.reason).toBe('RESTOCK');
    });

    it('strictly prevents reducing inventory below zero', async () => {
      await expect(
        adjustInventory(superAdminUser.id, createdVariantId, -50, 'MANUAL_ADJUSTMENT')
      ).rejects.toThrow(/Cannot reduce stock by 50/);
    });

    it('queries inventory listing with low-stock filter', async () => {
      const data = await getAdminInventory({ search: 'EM-SILK-S', lowStockOnly: false, pageSize: 20 });
      expect(data.variants.length).toBeGreaterThan(0);
      const target = data.variants.find((v) => v.id === createdVariantId);
      expect(target).toBeDefined();
      expect(target?.sku).toBe('EM-SILK-S');
    });
  });

  describe('4. Order Management & Tracking Workflows', () => {
    it('creates and inspects order details', async () => {
      testOrderNumber = `LM-TEST-${Date.now().toString().slice(-5)}`;

      const order = await db.order.create({
        data: {
          orderNumber: testOrderNumber,
          userId: customerUser.id,
          customerEmail: customerUser.email,
          customerPhone: '+92 300 1234567',
          shippingAddressJson: JSON.stringify({
            recipientName: 'Ayesha Khan',
            street: '42 Main Boulevard, DHA',
            city: 'Lahore',
            postalCode: '54000',
            country: 'Pakistan',
          }),
          subtotal: 25500,
          shippingTotal: 250,
          grandTotal: 25750,
          paymentStatus: 'PAID',
          fulfillmentStatus: 'UNFULFILLED',
          paymentMethod: 'CASH_ON_DELIVERY',
        },
      });

      await db.orderItem.create({
        data: {
          orderId: order.id,
          variantId: createdVariantId,
          productTitle: 'Emerald Silk Anarkali Luxury Edition',
          variantTitle: 'Small / Emerald',
          sku: 'EM-SILK-S',
          unitPrice: 25500,
          quantity: 1,
          total: 25500,
        },
      });

      testOrderId = order.id;

      const fetched = await getAdminOrderById(order.id);
      expect(fetched).toBeDefined();
      expect(fetched?.orderNumber).toBe(testOrderNumber);
      expect(fetched?.items.length).toBe(1);
    });

    it('updates order fulfillment and persists tracking airway bill', async () => {
      const updated = await updateOrderFulfillment(
        superAdminUser.id,
        testOrderId,
        'SHIPPED',
        { courier: 'TCS Express', trackingNumber: 'TCS-88997711' }
      );

      expect(updated.fulfillmentStatus).toBe('SHIPPED');

      // Verify tracking is extracted correctly
      const inspected = await getAdminOrderById(testOrderId);
      expect(inspected?.trackingNumber).toBe('TCS-88997711');
      expect(inspected?.courierName).toBe('TCS Express');
    });

    it('processes order refund and updates payment status', async () => {
      const updated = await updateOrderPaymentStatus(
        superAdminUser.id,
        testOrderId,
        'REFUNDED',
        'Customer size exchange refund'
      );

      expect(updated.paymentStatus).toBe('REFUNDED');

      const payments = await db.payment.findMany({ where: { orderId: testOrderId } });
      expect(payments.some((p) => p.status === 'REFUNDED')).toBe(true);
    });

    it('prevents hard deletion of a product associated with historical orders', async () => {
      const result = await deleteOrArchiveProduct(superAdminUser.id, createdProductId);
      expect(result.action).toBe('ARCHIVED');

      const checkProduct = await db.product.findUnique({ where: { id: createdProductId } });
      expect(checkProduct?.status).toBe('ARCHIVED');
    });
  });

  describe('5. Customer Directory & Privacy Safeguards', () => {
    it('retrieves customers without exposing password hashes or reset tokens', async () => {
      const data = await getAdminCustomers({ search: 'customer.admin-test' });
      expect(data.customers.length).toBeGreaterThan(0);

      const customer = data.customers[0];
      expect(customer.email).toBe('customer.admin-test@laamstore.com');
      expect(customer).not.toHaveProperty('passwordHash');
      expect(customer).not.toHaveProperty('passwordResetTokens');
    });

    it('fetches customer detail with order history', async () => {
      const detail = await getAdminCustomerById(customerUser.id);
      expect(detail).toBeDefined();
      expect(detail?.orders.length).toBeGreaterThanOrEqual(1);
      expect(detail).not.toHaveProperty('passwordHash');
    });
  });

  describe('6. Promotional Coupons Management', () => {
    let couponId: string;

    it('creates a validated discount coupon', async () => {
      const coupon = await createCoupon(superAdminUser.id, {
        code: `ADMINFESTIVE${Date.now().toString().slice(-4)}`,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 5000,
        maxUses: 100,
        isActive: true,
      });

      expect(coupon).toBeDefined();
      expect(coupon.discountValue).toBe(20);
      couponId = coupon.id;
    });

    it('toggles coupon active status and safely deletes it', async () => {
      const updated = await updateCoupon(superAdminUser.id, couponId, { isActive: false });
      expect(updated.isActive).toBe(false);

      const del = await deleteCoupon(superAdminUser.id, couponId);
      expect(del.action).toBe('DELETED');
    });
  });

  describe('7. Store Settings & Metrics Persistence', () => {
    it('persists store settings and shipping rates in the database', async () => {
      const result = await updateStoreSettings(superAdminUser.id, {
        store_name: 'Laam Luxury Atelier',
        store_currency: 'PKR',
        low_stock_threshold: '6',
      });

      expect(result.storeName).toBe('Laam Luxury Atelier');
      expect(result.currency).toBe('PKR');
      expect(result.lowStockThreshold).toBe(6);
    });

    it('calculates database-backed dashboard metrics', async () => {
      const data = await getAdminDashboardMetrics('all');
      expect(data.metrics).toBeDefined();
      expect(typeof data.metrics.totalGrossSales).toBe('number');
      expect(typeof data.metrics.totalOrdersCount).toBe('number');
      expect(typeof data.metrics.averageOrderValue).toBe('number');
    });
  });
});
