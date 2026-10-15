import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getAdminCoupons, createCoupon } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const coupons = await getAdminCoupons();
    return NextResponse.json({ coupons });
  } catch (error: any) {
    console.error('Admin coupons fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch coupons.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    const coupon = await createCoupon(auth.user.id, body, ip);
    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (error: any) {
    console.error('Admin coupon create error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create coupon.' }, { status: 400 });
  }
}
