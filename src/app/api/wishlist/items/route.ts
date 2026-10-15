import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { addProductToWishlist, getCustomerWishlist } from '@/lib/wishlist/wishlist-service';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json(
        { error: 'Please sign in to add designs to your wishlist.' },
        { status: 401 }
      );
    }

    const { productId } = await req.json();
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Valid product ID required.' }, { status: 400 });
    }

    const result = await addProductToWishlist(auth.user.id, productId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to save item.' }, { status: 400 });
    }

    const items = await getCustomerWishlist(auth.user.id);

    return NextResponse.json({
      success: true,
      items,
      message: 'Design saved to your wishlist.',
    });
  } catch (error: any) {
    console.error('Add to wishlist failed:', error);
    return NextResponse.json({ error: 'Unable to update wishlist.' }, { status: 500 });
  }
}
