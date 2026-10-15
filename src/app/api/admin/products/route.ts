import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getAdminProducts, createProduct } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const result = await getAdminProducts({ search, categoryId, status, page, pageSize });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin products fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch products.' }, { status: 500 });
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

    const product = await createProduct(auth.user.id, body, ip);

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error('Admin product create error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create product.' }, { status: 400 });
  }
}
