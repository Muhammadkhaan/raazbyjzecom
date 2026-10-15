import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { removeProductFromWishlist, getCustomerWishlist } from '@/lib/wishlist/wishlist-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const removed = await removeProductFromWishlist(auth.user.id, productId);
    const items = await getCustomerWishlist(auth.user.id);

    return NextResponse.json({
      success: true,
      removed,
      items,
      message: 'Design removed from wishlist.',
    });
  } catch (error: any) {
    console.error('Remove from wishlist failed:', error);
    return NextResponse.json({ error: 'Unable to remove item from wishlist.' }, { status: 500 });
  }
}
