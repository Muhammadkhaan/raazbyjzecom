import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getAccountDashboard } from '@/lib/account/account-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const dashboard = await getAccountDashboard(auth.user.id);
    if (!dashboard) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    return NextResponse.json({ dashboard });
  } catch (error: any) {
    console.error('Account dashboard failure:', error);
    return NextResponse.json({ error: 'Failed to retrieve account overview.' }, { status: 500 });
  }
}
