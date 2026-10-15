import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerOrderDetails } from '@/lib/account/account-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderIdOrNumber } = await params;
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    // STRICT RESOURCE OWNERSHIP GUARD: Verified inside getCustomerOrderDetails
    const order = await getCustomerOrderDetails(auth.user.id, orderIdOrNumber);

    if (!order) {
      // Return 404 to avoid leaking existence of another customer's order
      return NextResponse.json(
        { error: 'Order not found or unauthorized.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Fetch order detail error:', error);
    return NextResponse.json({ error: 'Failed to retrieve order details.' }, { status: 500 });
  }
}
