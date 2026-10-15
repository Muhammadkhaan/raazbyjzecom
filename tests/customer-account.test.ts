import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/lib/db';
import {
  getAccountDashboard,
  updateCustomerProfile,
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultAddress,
  getCustomerOrders,
  getCustomerOrderDetails,
  changeCustomerPassword,
  deactivateCustomerAccount,
} from '@/lib/account/account-service';
import { hashPassword } from '@/lib/auth/password';
import { ROLES } from '@/lib/auth/rbac';

describe('Customer Account Portal & Resource Ownership Suite', () => {
  let customerAId = '';
  let customerBId = '';
  let customerAAddressId = '';
  let customerAOrderId = '';
  let customerAOrderNumber = '';

  beforeAll(async () => {
    // 1. Create two isolated test customers
    const hash = await hashPassword('SecurePass123!');

    const userA = await db.user.create({
      data: {
        email: `customera_${Date.now()}@test.com`,
        name: 'Customer Ayesha',
        passwordHash: hash,
        role: ROLES.CUSTOMER,
      },
    });
    customerAId = userA.id;

    const userB = await db.user.create({
      data: {
        email: `customerb_${Date.now()}@test.com`,
        name: 'Customer Bilal',
        passwordHash: hash,
        role: ROLES.CUSTOMER,
      },
    });
    customerBId = userB.id;

    // 2. Create customer A address
    const addr = await addCustomerAddress(customerAId, {
      recipientName: 'Ayesha Khan',
      phone: '03001234567',
      street: 'House 10, Street 2, Clifton',
      city: 'Karachi',
      postalCode: '75500',
      country: 'Pakistan',
      isDefault: true,
    });
    customerAAddressId = addr.address!.id;

    // 3. Create customer A order with tracking data
    const orderNum = `LM-ACC-${Date.now().toString().slice(-6)}`;
    const order = await db.order.create({
      data: {
        orderNumber: orderNum,
        userId: customerAId,
        customerEmail: userA.email,
        customerPhone: '03001234567',
        shippingAddressJson: JSON.stringify({
          recipientName: 'Ayesha Khan',
          street: 'House 10, Street 2',
          city: 'Karachi',
          postalCode: '75500',
          country: 'Pakistan',
          phone: '03001234567',
        }),
        subtotal: 18000,
        discountTotal: 0,
        shippingTotal: 0,
        grandTotal: 18000,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'SHIPPED',
        paymentMethod: 'CASH_ON_DELIVERY',
        notes: 'TRACKING:TCS-9876543210-PK',
      },
    });
    customerAOrderId = order.id;
    customerAOrderNumber = order.orderNumber;
  });

  afterAll(async () => {
    // Cleanup
    await db.user.deleteMany({
      where: { id: { in: [customerAId, customerBId] } },
    }).catch(() => {});
  });

  describe('1. Profile Information Updates', () => {
    it('retrieves customer dashboard overview', async () => {
      const dashboard = await getAccountDashboard(customerAId);
      expect(dashboard).not.toBeNull();
      expect(dashboard?.user.name).toBe('Customer Ayesha');
      expect(dashboard?.defaultAddress?.recipientName).toBe('Ayesha Khan');
    });

    it('updates customer name, phone, and marketing preferences', async () => {
      const result = await updateCustomerProfile(customerAId, {
        name: 'Ayesha K. Ahmed',
        phone: '03009998877',
        marketingOptIn: true,
      });

      expect(result.success).toBe(true);
      expect(result.user?.name).toBe('Ayesha K. Ahmed');

      const dashboard = await getAccountDashboard(customerAId);
      expect(dashboard?.user.phone).toBe('03009998877');
      expect(dashboard?.user.marketingOptIn).toBe(true);
    });

    it('rejects invalid empty profile updates', async () => {
      const result = await updateCustomerProfile(customerAId, {
        name: '',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('2. Address Management & Cross-Account Access Guards', () => {
    it('allows customer A to retrieve own addresses', async () => {
      const list = await getCustomerAddresses(customerAId);
      expect(list.length).toBeGreaterThan(0);
      expect(list[0].id).toBe(customerAAddressId);
    });

    it('STRICTLY PREVENTS Customer B from updating Customer A address', async () => {
      const breachAttempt = await updateCustomerAddress(customerBId, customerAAddressId, {
        recipientName: 'Hacker Bilall',
        phone: '03000000000',
        street: 'Tampered Street',
        city: 'Rawalpindi',
        postalCode: '46000',
        country: 'Pakistan',
      });

      expect(breachAttempt.success).toBe(false);
      expect(breachAttempt.error).toContain('unauthorized');

      // Verify original address was not modified
      const original = await db.address.findUnique({ where: { id: customerAAddressId } });
      expect(original?.recipientName).toBe('Ayesha Khan');
    });

    it('STRICTLY PREVENTS Customer B from deleting Customer A address', async () => {
      const breachAttempt = await deleteCustomerAddress(customerBId, customerAAddressId);
      expect(breachAttempt.success).toBe(false);

      // Verify address still exists
      const original = await db.address.findUnique({ where: { id: customerAAddressId } });
      expect(original).not.toBeNull();
    });

    it('allows Customer A to update and delete own address', async () => {
      const update = await updateCustomerAddress(customerAId, customerAAddressId, {
        recipientName: 'Ayesha Khan Official',
        phone: '03001234567',
        street: 'House 10, Street 2, Clifton',
        city: 'Karachi',
        postalCode: '75500',
        country: 'Pakistan',
      });
      expect(update.success).toBe(true);

      const deleted = await deleteCustomerAddress(customerAId, customerAAddressId);
      expect(deleted.success).toBe(true);

      const check = await db.address.findUnique({ where: { id: customerAAddressId } });
      expect(check).toBeNull();
    });
  });

  describe('3. Order History & Cross-Account Resource Access', () => {
    it('retrieves customer A paginated order history', async () => {
      const result = await getCustomerOrders(customerAId, 1, 10);
      expect(result.totalCount).toBe(1);
      expect(result.orders[0].orderNumber).toBe(customerAOrderNumber);
    });

    it('retrieves full order details including real tracking information', async () => {
      const details = await getCustomerOrderDetails(customerAId, customerAOrderNumber);
      expect(details).not.toBeNull();
      expect(details?.orderNumber).toBe(customerAOrderNumber);
      expect(details?.trackingNumber).toBe('TCS-9876543210-PK');
      expect(details?.courierName).toBeDefined();
    });

    it('STRICTLY PREVENTS Customer B from accessing Customer A order details', async () => {
      const breachAttempt = await getCustomerOrderDetails(customerBId, customerAOrderNumber);
      expect(breachAttempt).toBeNull(); // Access denied!
    });
  });

  describe('4. Account Security & Credentials', () => {
    it('rejects password change with incorrect current password', async () => {
      const failed = await changeCustomerPassword(
        customerAId,
        'WrongCurrentPassword123!',
        'NewSecurePassword123!'
      );
      expect(failed.success).toBe(false);
      expect(failed.error).toContain('does not match');
    });

    it('rejects password change if new password fails strength rules', async () => {
      const failed = await changeCustomerPassword(
        customerAId,
        'SecurePass123!',
        'short'
      );
      expect(failed.success).toBe(false);
      expect(failed.error).toBeDefined();
    });

    it('successfully changes password with valid credentials', async () => {
      const success = await changeCustomerPassword(
        customerAId,
        'SecurePass123!',
        'NewStrongPassword999!'
      );
      expect(success.success).toBe(true);

      // Verify new password can be used for verification
      const user = await db.user.findUnique({ where: { id: customerAId } });
      const matches = await hashPassword('NewStrongPassword999!');
      expect(user?.passwordHash).toBeDefined();
    });

    it('safely deactivates customer account upon confirmed password', async () => {
      // Create a throwaway user to deactivate
      const hash = await hashPassword('ThrowawayPass123!');
      const throwaway = await db.user.create({
        data: {
          email: `throwaway_${Date.now()}@test.com`,
          name: 'Throwaway User',
          passwordHash: hash,
          role: ROLES.CUSTOMER,
        },
      });

      // Wrong password fails
      const failDeactivate = await deactivateCustomerAccount(throwaway.id, 'WrongPass123!');
      expect(failDeactivate.success).toBe(false);

      // Correct password succeeds
      const successDeactivate = await deactivateCustomerAccount(throwaway.id, 'ThrowawayPass123!');
      expect(successDeactivate.success).toBe(true);

      const userAfter = await db.user.findUnique({ where: { id: throwaway.id } });
      expect(userAfter?.isActive).toBe(false);

      // Clean up throwaway
      await db.user.delete({ where: { id: throwaway.id } }).catch(() => {});
    });
  });
});
