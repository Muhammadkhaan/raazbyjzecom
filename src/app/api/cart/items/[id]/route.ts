import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import {
  getOrCreateCart,
  getCartDetails,
  updateItemQuantity,
  removeItemFromCart,
  GUEST_CART_COOKIE_NAME,
} from '@/lib/cart/cart-service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;
    const body = await req.json();
    const { quantity } = body;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty)) {
      return NextResponse.json({ error: 'Valid quantity number required.' }, { status: 400 });
    }

    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId } = await getOrCreateCart(auth?.user.id, guestToken);

    const result = await updateItemQuantity(cartId, itemId, qty);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update item.' }, { status: 400 });
    }

    const cart = await getCartDetails(cartId);

    return NextResponse.json({
      cart,
      newQuantity: result.newQuantity,
      warning: result.warning,
    });
  } catch (error: any) {
    console.error('Update cart item error:', error);
    return NextResponse.json({ error: 'Unable to update item quantity.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: itemId } = await params;

    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;
    const guestToken = req.cookies.get(GUEST_CART_COOKIE_NAME)?.value || null;

    const { cartId } = await getOrCreateCart(auth?.user.id, guestToken);

    const removed = await removeItemFromCart(cartId, itemId);
    const cart = await getCartDetails(cartId);

    return NextResponse.json({
      cart,
      removed,
      message: 'Item removed from shopping bag.',
    });
  } catch (error: any) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Unable to remove item.' }, { status: 500 });
  }
}
