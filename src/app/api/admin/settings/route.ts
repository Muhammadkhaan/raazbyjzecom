import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession, forbiddenResponse } from '@/lib/admin/admin-auth';
import { getStoreSettings, updateStoreSettings } from '@/lib/admin/admin-service';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const settings = await getStoreSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Admin settings fetch error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch settings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminSession(req);
    if (!auth) {
      return forbiddenResponse();
    }

    const body = await req.json();
    const { settings, shippingMethods } = body;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;

    const updated = await updateStoreSettings(auth.user.id, settings || {}, shippingMethods, ip);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Admin settings update error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update settings.' }, { status: 400 });
  }
}
