import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getAdminCustomers } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const { searchParams } = req.nextUrl;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const data = await getAdminCustomers({ search, page, pageSize });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin customers error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch customers.' }, { status: 500 });
  }
}
