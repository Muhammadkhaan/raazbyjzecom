import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getAdminInventory, adjustInventory } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || undefined;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const threshold = parseInt(searchParams.get('threshold') || '5', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '15', 10);

    const data = await getAdminInventory({ search, lowStockOnly, threshold, page, pageSize });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin inventory fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch inventory.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const { variantId, changeAmount, reason } = body;

    if (!variantId || typeof changeAmount !== 'number') {
      return NextResponse.json(
        { error: 'variantId and numeric changeAmount are required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const result = await adjustInventory(auth.user.id, variantId, changeAmount, reason, ip);

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Admin inventory adjust error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to adjust inventory.' }, { status: 400 });
  }
}
