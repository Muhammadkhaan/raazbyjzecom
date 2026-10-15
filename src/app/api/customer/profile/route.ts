import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Authentication is required.' },
        { status: 401 }
      );
    }

    const auth = await validateSessionToken(token);
    if (!auth) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Invalid or expired session.' },
        { status: 401 }
      );
    }

    const profile = await db.customerProfile.findUnique({
      where: { userId: auth.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Customer profile error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile.' },
      { status: 500 }
    );
  }
}
