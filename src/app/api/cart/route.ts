import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import {
  getOrCreateCart,
  getCartDetails,
  clearCart,
  GUEST_CART_COOKIE_NAME,
} from '@/lib/cart/cart-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId, guestToken: newGuestToken } = await getOrCreateCart(
      auth?.user.id,
      guestToken
    );

    const cart = await getCartDetails(cartId);

    const response = NextResponse.json({ cart });

    // If new guest cart token was created, set cookie
    if (newGuestToken && newGuestToken !== guestToken) {
      response.cookies.set({
        name: GUEST_CART_COOKIE_NAME,
        value: newGuestToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    console.error('Failed to retrieve cart:', error);
    return NextResponse.json(
      { error: 'Unable to retrieve shopping bag.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId } = await getOrCreateCart(auth?.user.id, guestToken);
    await clearCart(cartId);

    const cart = await getCartDetails(cartId);
    return NextResponse.json({ cart, message: 'Bag cleared.' });
  } catch (error: any) {
    console.error('Failed to clear cart:', error);
    return NextResponse.json(
      { error: 'Unable to clear shopping bag.' },
      { status: 500 }
    );
  }
}
