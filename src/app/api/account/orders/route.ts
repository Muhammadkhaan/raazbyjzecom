import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerOrders } from '@/lib/account/account-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '8', 10);

    const result = await getCustomerOrders(auth.user.id, page, pageSize);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fetch customer orders error:', error);
    return NextResponse.json({ error: 'Failed to retrieve order history.' }, { status: 500 });
  }
}
