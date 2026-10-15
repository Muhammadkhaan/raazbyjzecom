import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import {
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddresses,
} from '@/lib/account/account-service';

export async function PATCH(
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

    const body = await req.json();
    const result = await updateCustomerAddress(auth.user.id, addressId, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const addresses = await getCustomerAddresses(auth.user.id);
    return NextResponse.json({
      success: true,
      address: result.address,
      addresses,
      message: 'Address updated successfully.',
    });
  } catch (error: any) {
    console.error('Update address error:', error);
    return NextResponse.json({ error: 'Failed to update address.' }, { status: 500 });
  }
}

export async function DELETE(
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

    const result = await deleteCustomerAddress(auth.user.id, addressId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const addresses = await getCustomerAddresses(auth.user.id);
    return NextResponse.json({
      success: true,
      addresses,
      message: 'Address removed.',
    });
  } catch (error: any) {
    console.error('Delete address error:', error);
    return NextResponse.json({ error: 'Failed to delete address.' }, { status: 500 });
  }
}
