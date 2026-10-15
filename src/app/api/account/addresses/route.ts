import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getCustomerAddresses, addCustomerAddress } from '@/lib/account/account-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const addresses = await getCustomerAddresses(auth.user.id);
    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error('Fetch addresses error:', error);
    return NextResponse.json({ error: 'Failed to retrieve addresses.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const result = await addCustomerAddress(auth.user.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const addresses = await getCustomerAddresses(auth.user.id);
    return NextResponse.json({
      success: true,
      address: result.address,
      addresses,
      message: 'Address saved successfully.',
    });
  } catch (error: any) {
    console.error('Add address error:', error);
    return NextResponse.json({ error: 'Failed to save address.' }, { status: 500 });
  }
}
