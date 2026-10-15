import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAvailablePaymentMethods } from '@/lib/payments';

export async function GET() {
  try {
    const [shippingMethods, paymentMethods, freeThresholdSetting] = await Promise.all([
      db.shippingMethod.findMany({
        where: { isActive: true },
        orderBy: { rate: 'asc' },
      }),
      getAvailablePaymentMethods(),
      db.storeSetting.findUnique({
        where: { key: 'FREE_SHIPPING_THRESHOLD' },
      }),
    ]);

    return NextResponse.json({
      shippingMethods,
      paymentMethods,
      freeShippingThreshold: freeThresholdSetting ? parseFloat(freeThresholdSetting.value) : 10000,
    });
  } catch (error: any) {
    console.error('Checkout config failed:', error);
    return NextResponse.json({ error: 'Failed to load checkout options.' }, { status: 500 });
  }
}
