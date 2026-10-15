import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getAdminAuditLogs } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const data = await getAdminAuditLogs(page, pageSize);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Admin audit logs error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch audit logs.' }, { status: 500 });
  }
}
