import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import {
  getOrCreateCart,
  getCartDetails,
  addItemToCart,
  GUEST_CART_COOKIE_NAME,
} from '@/lib/cart/cart-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variantId, quantity = 1 } = body;

    if (!variantId || typeof variantId !== 'string') {
      return NextResponse.json(
        { error: 'A valid product variant ID is required.' },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1.' },
        { status: 400 }
      );
    }

    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId, guestToken: newGuestToken } = await getOrCreateCart(
      auth?.user.id,
      guestToken
    );

    const result = await addItemToCart(cartId, variantId, qty);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to add item to bag.' },
        { status: 400 }
      );
    }

    const updatedCart = await getCartDetails(cartId);

    const response = NextResponse.json({
      cart: updatedCart,
      warning: result.warning,
      message: 'Item added to shopping bag.',
    });

    if (newGuestToken && newGuestToken !== guestToken) {
      response.cookies.set({
        name: GUEST_CART_COOKIE_NAME,
        value: newGuestToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Add to cart failed:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while adding to bag.' },
      { status: 500 }
    );
  }
}
