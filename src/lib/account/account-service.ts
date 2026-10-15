import { db } from '@/lib/db';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password';
import { validateAddress, ShippingAddressInput } from '@/lib/checkout/checkout-service';

export interface ProfileUpdateInput {
  name: string;
  phone?: string;
  marketingOptIn?: boolean;
}

export interface AddressInput {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  type?: 'SHIPPING' | 'BILLING';
  isDefault?: boolean;
}

/**
 * Retrieves dashboard overview for authenticated customer
 */
export async function getAccountDashboard(userId: string) {
  const [user, defaultAddress, recentOrders, wishlistCount] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    db.address.findFirst({
      where: { userId, isDefault: true },
    }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        items: true,
      },
    }),
    db.wishlistItem.count({
      where: { wishlist: { userId } },
    }),
  ]);

  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      phone: user.profile?.phone || null,
      marketingOptIn: user.profile?.marketingOptIn || false,
    },
    defaultAddress: defaultAddress || null,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      grandTotal: o.grandTotal,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
    })),
    wishlistCount,
  };
}

/**
 * Updates customer profile information
 */
export async function updateCustomerProfile(userId: string, data: ProfileUpdateInput) {
  if (!data.name || data.name.trim().length < 2) {
    return { success: false, error: 'Full name must be at least 2 characters.' };
  }

  const updated = await db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { name: data.name.trim() },
    });

    await tx.customerProfile.upsert({
      where: { userId },
      update: {
        phone: data.phone?.trim() || null,
        marketingOptIn: Boolean(data.marketingOptIn),
      },
      create: {
        userId,
        phone: data.phone?.trim() || null,
        marketingOptIn: Boolean(data.marketingOptIn),
      },
    });

    return user;
  });

  return { success: true, user: updated };
}

/**
 * Retrieves all saved addresses for a customer
 */
export async function getCustomerAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

/**
 * Adds a new address for the customer with ownership enforcement
 */
export async function addCustomerAddress(
  userId: string,
  input: AddressInput
): Promise<{ success: boolean; address?: any; error?: string }> {
  const validation = validateAddress(input);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  return db.$transaction(async (tx) => {
    // If setting as default, clear existing default flag
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Check if this is the user's first address; if so, make default
    const existingCount = await tx.address.count({ where: { userId } });
    const isDefault = input.isDefault || existingCount === 0;

    const address = await tx.address.create({
      data: {
        userId, // Strictly derived from session
        recipientName: input.recipientName.trim(),
        phone: input.phone.trim(),
        street: input.street.trim(),
        city: input.city.trim(),
        state: input.state?.trim() || null,
        postalCode: input.postalCode.trim(),
        country: input.country || 'Pakistan',
        type: input.type || 'SHIPPING',
        isDefault,
      },
    });

    return { success: true, address };
  });
}

/**
 * Updates an existing address verifying resource ownership
 */
export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: AddressInput
): Promise<{ success: boolean; address?: any; error?: string }> {
  const validation = validateAddress(input);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  // Verify ownership
  const existing = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    return { success: false, error: 'Address not found or unauthorized.' };
  }

  return db.$transaction(async (tx) => {
    if (input.isDefault && !existing.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await tx.address.update({
      where: { id: addressId },
      data: {
        recipientName: input.recipientName.trim(),
        phone: input.phone.trim(),
        street: input.street.trim(),
        city: input.city.trim(),
        state: input.state?.trim() || null,
        postalCode: input.postalCode.trim(),
        country: input.country || 'Pakistan',
        type: input.type || existing.type,
        isDefault: input.isDefault ?? existing.isDefault,
      },
    });

    return { success: true, address: updated };
  });
}

/**
 * Deletes an address verifying resource ownership
 */
export async function deleteCustomerAddress(userId: string, addressId: string) {
  const existing = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    return { success: false, error: 'Address not found or unauthorized.' };
  }

  await db.address.delete({ where: { id: addressId } });

  // If deleted address was default, promote another address to default
  if (existing.isDefault) {
    const nextAddress = await db.address.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (nextAddress) {
      await db.address.update({
        where: { id: nextAddress.id },
        data: { isDefault: true },
      });
    }
  }

  return { success: true };
}

/**
 * Sets an address as the customer's default address
 */
export async function setDefaultAddress(userId: string, addressId: string) {
  const existing = await db.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    return { success: false, error: 'Address not found or unauthorized.' };
  }

  await db.$transaction([
    db.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    db.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  return { success: true };
}

/**
 * Retrieves paginated orders strictly for the authenticated customer
 */
export async function getCustomerOrders(userId: string, page = 1, pageSize = 8) {
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * pageSize;

  const [totalCount, orders] = await Promise.all([
    db.order.count({ where: { userId } }),
    db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        items: true,
      },
    }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      subtotal: o.subtotal,
      discountTotal: o.discountTotal,
      shippingTotal: o.shippingTotal,
      grandTotal: o.grandTotal,
      paymentStatus: o.paymentStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      paymentMethod: o.paymentMethod,
      items: o.items.map((i) => ({
        id: i.id,
        productTitle: i.productTitle,
        variantTitle: i.variantTitle,
        sku: i.sku,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        total: i.total,
      })),
      itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: safePage,
  };
}

/**
 * Retrieves order details strictly verifying resource ownership
 */
export async function getCustomerOrderDetails(userId: string, orderIdOrNumber: string) {
  const order = await db.order.findFirst({
    where: {
      userId, // STRICT RESOURCE OWNERSHIP GUARD: Prohibits viewing other customer's orders
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
    },
    include: {
      items: true,
      shippingMethod: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) return null;

  // Extract tracking details ONLY when genuine tracking data exists
  let trackingNumber: string | null = null;
  let courierName: string | null = null;
  if (order.notes && order.notes.includes('TRACKING:')) {
    const match = order.notes.match(/TRACKING:([A-Za-z0-9-_]+)/);
    if (match) trackingNumber = match[1];
    courierName = order.shippingMethod?.name || 'TCS Express';
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    shippingAddress: JSON.parse(order.shippingAddressJson),
    billingAddress: order.billingAddressJson ? JSON.parse(order.billingAddressJson) : null,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    grandTotal: order.grandTotal,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentMethod: order.paymentMethod,
    shippingMethodName: order.shippingMethod?.name || 'Standard Courier',
    items: order.items,
    trackingNumber,
    courierName,
    payment: order.payments[0] || null,
  };
}

/**
 * Changes password securely verifying current credentials
 */
export async function changeCustomerPassword(
  userId: string,
  currentPass: string,
  newPass: string
) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found.' };

  const matches = await verifyPassword(currentPass, user.passwordHash);
  if (!matches) {
    return { success: false, error: 'Current password does not match.' };
  }

  const strength = validatePasswordStrength(newPass);
  if (!strength.isValid) {
    return { success: false, error: strength.message };
  }

  const newHash = await hashPassword(newPass);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'CHANGE_PASSWORD',
        entityType: 'AUTH',
        entityId: userId,
      },
    });
  });

  return { success: true };
}

/**
 * Deactivates customer account securely
 */
export async function deactivateCustomerAccount(userId: string, confirmationPass: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: 'User not found.' };

  const matches = await verifyPassword(confirmationPass, user.passwordHash);
  if (!matches) {
    return { success: false, error: 'Confirmation password does not match.' };
  }

  await db.$transaction(async (tx) => {
    // Deactivate user
    await tx.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Destroy all active sessions
    await tx.session.deleteMany({
      where: { userId },
    });

    await tx.auditLog.create({
      data: {
        actorId: userId,
        action: 'DEACTIVATE_ACCOUNT',
        entityType: 'USER',
        entityId: userId,
      },
    });
  });

  return { success: true };
}
