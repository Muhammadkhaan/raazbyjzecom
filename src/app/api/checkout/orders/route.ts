import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getOrCreateCart, GUEST_CART_COOKIE_NAME } from '@/lib/cart/cart-service';
import { processCheckout } from '@/lib/checkout/checkout-service';
import { checkRateLimit } from '@/lib/auth/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = checkRateLimit(ip, { keyPrefix: 'checkout-orders', maxAttempts: 15, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many order creation attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();

    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId } = await getOrCreateCart(auth?.user.id, guestToken);

    const result = await processCheckout({
      cartId,
      userId: auth?.user.id || null,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      shippingMethodCode: body.shippingMethodCode || 'STANDARD',
      paymentMethod: body.paymentMethod || 'CASH_ON_DELIVERY',
      couponCode: body.couponCode,
      notes: body.notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      message: 'Order created successfully.',
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during order creation.' },
      { status: 500 }
    );
  }
}
