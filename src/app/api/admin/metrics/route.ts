import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { isAuthorized, ROLES } from '@/lib/auth/rbac';
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

    // Role check: Only SUPER_ADMIN and STAFF allowed
    if (!isAuthorized(auth.user.role, [ROLES.SUPER_ADMIN, ROLES.STAFF])) {
      return NextResponse.json(
        { error: 'FORBIDDEN: Customer accounts are prohibited from accessing administrative endpoints.' },
        { status: 403 }
      );
    }

    // Return metrics
    const [productCount, userCount, orderCount] = await Promise.all([
      db.product.count(),
      db.user.count(),
      db.order.count(),
    ]);

    return NextResponse.json({
      authorizedAdmin: {
        id: auth.user.id,
        email: auth.user.email,
        role: auth.user.role,
      },
      metrics: {
        totalProducts: productCount,
        totalUsers: userCount,
        totalOrders: orderCount,
      },
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin metrics.' },
      { status: 500 }
    );
  }
}
