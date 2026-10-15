import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { updateCustomerProfile } from '@/lib/account/account-service';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        phone: user.profile?.phone || '',
        marketingOptIn: user.profile?.marketingOptIn || false,
      },
    });
  } catch (error: any) {
    console.error('Profile fetch failure:', error);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const auth = sessionToken ? await validateSessionToken(sessionToken) : null;

    if (!auth) {
      return NextResponse.json({ error: 'UNAUTHORIZED: Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const result = await updateCustomerProfile(auth.user.id, {
      name: body.name,
      phone: body.phone,
      marketingOptIn: body.marketingOptIn,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      message: 'Profile details successfully updated.',
    });
  } catch (error: any) {
    console.error('Profile update failure:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
