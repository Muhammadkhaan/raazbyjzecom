import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getAdminOrders } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || undefined;
    const fulfillmentStatus = searchParams.get('fulfillmentStatus') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const data = await getAdminOrders({ search, fulfillmentStatus, paymentStatus, page, pageSize });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch orders.' }, { status: 500 });
  }
}
