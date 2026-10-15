import { db } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/payments';
import { getCartDetails, clearCart } from '@/lib/cart/cart-service';

export interface ShippingAddressInput {
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface CheckoutInput {
  cartId: string;
  userId?: string | null;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddressInput;
  billingAddress?: ShippingAddressInput;
  shippingMethodCode: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  idempotencyKey?: string;
}

export interface OrderCalculationResult {
  items: {
    variantId: string;
    productTitle: string;
    variantTitle: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  grandTotal: number;
  shippingMethod: {
    id: string;
    name: string;
    code: string;
    rate: number;
  };
  coupon?: {
    id: string;
    code: string;
    discountValue: number;
  };
}

/**
 * Validates shipping address fields
 */
export function validateAddress(address: ShippingAddressInput): { isValid: boolean; error?: string } {
  if (!address.recipientName || address.recipientName.trim().length < 2) {
    return { isValid: false, error: 'Recipient name must be at least 2 characters long.' };
  }
  if (!address.phone || address.phone.trim().length < 7) {
    return { isValid: false, error: 'A valid contact phone number is required.' };
  }
  if (!address.street || address.street.trim().length < 5) {
    return { isValid: false, error: 'Street address must be at least 5 characters long.' };
  }
  if (!address.city || address.city.trim().length < 2) {
    return { isValid: false, error: 'City name is required.' };
  }
  if (!address.postalCode || address.postalCode.trim().length < 3) {
    return { isValid: false, error: 'Postal / ZIP code is required.' };
  }
  return { isValid: true };
}

/**
 * Calculates authoritative order totals directly from database records.
 * The browser is NEVER trusted for pricing, discounts, or stock.
 */
export async function calculateOrderTotals(params: {
  cartId: string;
  shippingMethodCode: string;
  couponCode?: string;
}): Promise<{ success: boolean; error?: string; calculation?: OrderCalculationResult }> {
  // 1. Fetch live cart
  const cart = await getCartDetails(params.cartId);

  if (!cart || cart.items.length === 0) {
    return { success: false, error: 'Your shopping bag is empty.' };
  }

  if (cart.hasUnavailableItems) {
    return { success: false, error: 'Your bag contains items that are currently unavailable. Please review your bag.' };
  }

  // 2. Fetch shipping method
  const shippingMethod = await db.shippingMethod.findUnique({
    where: { code: params.shippingMethodCode.toUpperCase() },
  });

  if (!shippingMethod || !shippingMethod.isActive) {
    return { success: false, error: 'Invalid or inactive shipping method selected.' };
  }

  // 3. Free shipping threshold check
  const thresholdSetting = await db.storeSetting.findUnique({
    where: { key: 'FREE_SHIPPING_THRESHOLD' },
  });
  const freeThreshold = thresholdSetting ? parseFloat(thresholdSetting.value) : 10000;

  let shippingTotal = shippingMethod.rate;
  if (cart.subtotal >= freeThreshold && shippingMethod.code === 'STANDARD') {
    shippingTotal = 0; // Free standard shipping qualifies
  }

  // 4. Coupon Discount Calculation
  let discountTotal = 0;
  let appliedCoupon: { id: string; code: string; discountValue: number } | undefined;

  if (params.couponCode && params.couponCode.trim()) {
    const coupon = await db.coupon.findUnique({
      where: { code: params.couponCode.trim().toUpperCase() },
    });

    if (coupon && coupon.isActive) {
      const now = new Date();
      const isExpired = coupon.expiresAt && coupon.expiresAt < now;
      const isExhausted = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
      const meetsMinOrder = !coupon.minOrderValue || cart.subtotal >= coupon.minOrderValue;

      if (!isExpired && !isExhausted && meetsMinOrder) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountTotal = (cart.subtotal * coupon.discountValue) / 100;
        } else {
          discountTotal = Math.min(coupon.discountValue, cart.subtotal);
        }
        appliedCoupon = {
          id: coupon.id,
          code: coupon.code,
          discountValue: discountTotal,
        };
      }
    }
  }

  const grandTotal = Math.max(0, cart.subtotal - discountTotal + shippingTotal);

  const items = cart.items.map((i) => ({
    variantId: i.variantId,
    productTitle: i.productTitle,
    variantTitle: i.variantTitle,
    sku: i.sku,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
    total: i.subtotal,
  }));

  return {
    success: true,
    calculation: {
      items,
      subtotal: cart.subtotal,
      discountTotal,
      shippingTotal,
      grandTotal,
      shippingMethod: {
        id: shippingMethod.id,
        name: shippingMethod.name,
        code: shippingMethod.code,
        rate: shippingTotal,
      },
      coupon: appliedCoupon,
    },
  };
}

/**
 * Processes checkout atomically inside a database transaction:
 * - Revalidates stock and prices immediately before creation
 * - Deducts inventory safely avoiding overselling
 * - Creates immutable snapshots of purchased items and address
 * - Initiates payment with selected provider
 * - Clears customer cart
 */
export async function processCheckout(input: CheckoutInput): Promise<{
  success: boolean;
  error?: string;
  order?: {
    id: string;
    orderNumber: string;
    grandTotal: number;
    paymentStatus: string;
    paymentInstructions?: string;
  };
}> {
  // 1. Validate Customer Contact
  if (!input.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.customerEmail)) {
    return { success: false, error: 'Please enter a valid email address for order notifications.' };
  }
  if (!input.customerPhone || input.customerPhone.trim().length < 7) {
    return { success: false, error: 'A valid phone number is required for courier delivery.' };
  }

  // 2. Validate Address
  const addressCheck = validateAddress(input.shippingAddress);
  if (!addressCheck.isValid) {
    return { success: false, error: addressCheck.error };
  }

  // 3. Resolve Payment Adapter
  const paymentAdapter = getPaymentAdapter(input.paymentMethod);
  if (!paymentAdapter) {
    return { success: false, error: 'The selected payment method is not supported.' };
  }

  const isAvailable = await paymentAdapter.isAvailable();
  if (!isAvailable) {
    return {
      success: false,
      error: `Payment method ${input.paymentMethod} is currently unavailable.`,
    };
  }

  // 4. Calculate Authoritative Totals
  const calculationResult = await calculateOrderTotals({
    cartId: input.cartId,
    shippingMethodCode: input.shippingMethodCode,
    couponCode: input.couponCode,
  });

  if (!calculationResult.success || !calculationResult.calculation) {
    return { success: false, error: calculationResult.error || 'Failed to calculate order totals.' };
  }

  const calc = calculationResult.calculation;

  // 5. Generate Order Number
  const orderNumber = `LM-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // 6. Atomic Database Transaction: Deduct Stock & Create Order
  try {
    const createdOrder = await db.$transaction(async (tx) => {
      // Re-verify and deduct stock for every variant
      for (const item of calc.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.inventoryCount < item.quantity) {
          throw new Error(
            `Insufficient stock for "${item.productTitle} (${item.variantTitle})". Only ${
              variant?.inventoryCount || 0
            } left.`
          );
        }

        // Deduct inventory atomically
        const newBalance = variant.inventoryCount - item.quantity;
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { inventoryCount: newBalance },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            changeAmount: -item.quantity,
            newBalance,
            reason: 'ORDER_PLACED',
            actorId: input.userId || undefined,
          },
        });
      }

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId || null,
          customerEmail: input.customerEmail.toLowerCase().trim(),
          customerPhone: input.customerPhone.trim(),
          shippingAddressJson: JSON.stringify(input.shippingAddress),
          billingAddressJson: JSON.stringify(input.billingAddress || input.shippingAddress),
          subtotal: calc.subtotal,
          discountTotal: calc.discountTotal,
          shippingTotal: calc.shippingTotal,
          grandTotal: calc.grandTotal,
          paymentStatus: 'PENDING',
          fulfillmentStatus: 'UNFULFILLED',
          paymentMethod: input.paymentMethod,
          shippingMethodId: calc.shippingMethod.id,
          couponId: calc.coupon?.id || null,
          notes: input.notes || null,
        },
      });

      // Create OrderItems (Immutable Snapshots)
      for (const item of calc.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            variantId: item.variantId,
            productTitle: item.productTitle,
            variantTitle: item.variantTitle,
            sku: item.sku,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.total,
          },
        });
      }

      // If coupon used, verify validity and increment count
      if (calc.coupon?.id) {
        const couponRecord = await tx.coupon.findUnique({
          where: { id: calc.coupon.id },
        });
        if (
          !couponRecord ||
          !couponRecord.isActive ||
          (couponRecord.expiresAt && couponRecord.expiresAt < new Date()) ||
          (couponRecord.maxUses && couponRecord.usedCount >= couponRecord.maxUses)
        ) {
          throw new Error('The applied promotional coupon is no longer valid or has reached its usage limit.');
        }
        await tx.coupon.update({
          where: { id: calc.coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear the customer's cart
      await tx.cartItem.deleteMany({
        where: { cartId: input.cartId },
      });

      return order;
    });

    // 7. Initiate Payment with Adapter
    const paymentResult = await paymentAdapter.initiatePayment({
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      amount: createdOrder.grandTotal,
      currency: 'PKR',
      customerEmail: createdOrder.customerEmail,
    });

    // Record Payment
    await db.payment.create({
      data: {
        orderId: createdOrder.id,
        amount: createdOrder.grandTotal,
        currency: 'PKR',
        provider: input.paymentMethod,
        transactionId: paymentResult.transactionId || null,
        status: paymentResult.status,
        rawResponseJson: paymentResult.rawDetails ? JSON.stringify(paymentResult.rawDetails) : null,
      },
    });

    return {
      success: true,
      order: {
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        grandTotal: createdOrder.grandTotal,
        paymentStatus: paymentResult.status,
        paymentInstructions: paymentResult.instructions,
      },
    };
  } catch (err: any) {
    console.error('Order creation transaction failed:', err);
    return {
      success: false,
      error: err.message || 'Unable to place order due to a transaction conflict. Please try again.',
    };
  }
}

/**
 * Retrieves confirmed order details with access control
 */
export async function getOrderConfirmation(orderNumber: string, userId?: string | null) {
  if (!orderNumber || typeof orderNumber !== 'string') return null;

  const order = await db.order.findUnique({
    where: { orderNumber: orderNumber.trim() },
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

  // Access control check: If order has userId and requesting user is logged in as someone else, deny
  if (order.userId && userId && order.userId !== userId) {
    return null; // Deny access to other customer's order
  }

  const shippingAddress = JSON.parse(order.shippingAddressJson);

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shippingTotal: order.shippingTotal,
    grandTotal: order.grandTotal,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentMethod: order.paymentMethod,
    shippingMethodName: order.shippingMethod?.name || 'Standard Courier',
    shippingAddress,
    items: order.items,
    createdAt: order.createdAt,
    latestPayment: order.payments[0] || null,
  };
}
