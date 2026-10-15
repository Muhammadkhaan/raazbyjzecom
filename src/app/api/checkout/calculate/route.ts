import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getOrCreateCart, GUEST_CART_COOKIE_NAME } from '@/lib/cart/cart-service';
import { calculateOrderTotals } from '@/lib/checkout/checkout-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shippingMethodCode = 'STANDARD', couponCode } = body;

    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId } = await getOrCreateCart(auth?.user.id, guestToken);

    const result = await calculateOrderTotals({
      cartId,
      shippingMethodCode,
      couponCode,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ calculation: result.calculation });
  } catch (error: any) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate order totals.' }, { status: 500 });
  }
}
