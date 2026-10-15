import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, destroySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { deactivateCustomerAccount } from '@/lib/account/account-service';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const { confirmationPassword } = await req.json();
    if (!confirmationPassword) {
      return NextResponse.json(
        { error: 'Please enter your account password to confirm account deletion.' },
        { status: 400 }
      );
    }

    const result = await deactivateCustomerAccount(auth.user.id, confirmationPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Destroy active session and clear cookie
    if (sessionToken) {
      await destroySession(sessionToken);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Your account has been deactivated.',
    });

    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error: any) {
    console.error('Account deactivation error:', error);
    return NextResponse.json({ error: 'Failed to deactivate account.' }, { status: 500 });
  }
}
