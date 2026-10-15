import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { setDefaultAddress, getCustomerAddresses } from '@/lib/account/account-service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: addressId } = await params;
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const result = await setDefaultAddress(auth.user.id, addressId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const addresses = await getCustomerAddresses(auth.user.id);
    return NextResponse.json({
      success: true,
      addresses,
      message: 'Default address updated.',
    });
  } catch (error: any) {
    console.error('Set default address error:', error);
    return NextResponse.json({ error: 'Failed to set default address.' }, { status: 500 });
  }
}
