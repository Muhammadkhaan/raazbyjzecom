import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerWishlist } from '@/lib/wishlist/wishlist-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({
        isAuthenticated: false,
        items: [],
        message: 'Sign in to sync your wishlist across all devices.',
      });
    }

    const items = await getCustomerWishlist(auth.user.id);

    return NextResponse.json({
      isAuthenticated: true,
      items,
    });
  } catch (error: any) {
    console.error('Failed to get wishlist:', error);
    return NextResponse.json({ error: 'Unable to retrieve wishlist.' }, { status: 500 });
  }
}
