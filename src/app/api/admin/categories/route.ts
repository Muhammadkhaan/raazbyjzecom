import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Admin categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories.' }, { status: 500 });
  }
}
