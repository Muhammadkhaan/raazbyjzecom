import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPaymentAdapter } from '@/lib/payments';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const payload = await req.text();
    const adapter = getPaymentAdapter('STRIPE');

    if (!adapter || !adapter.verifyWebhook) {
      return NextResponse.json({ error: 'Stripe webhook adapter unavailable' }, { status: 500 });
    }

    const verification = await adapter.verifyWebhook(payload, signature);

    if (!verification.verified || !verification.orderNumber) {
      return NextResponse.json({ error: verification.error || 'Invalid signature' }, { status: 400 });
    }

    // Process webhook idempotently
    const order = await db.order.findUnique({
      where: { orderNumber: verification.orderNumber },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // IDEMPOTENCY CHECK: If already marked as PAID, do not re-process
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ received: true, message: 'Order was already processed.' });
    }

    await db.$transaction(async (tx) => {
      // 1. Update order payment status
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: verification.status === 'COMPLETED' ? 'PAID' : 'FAILED',
          fulfillmentStatus: verification.status === 'COMPLETED' ? 'PROCESSING' : 'UNFULFILLED',
        },
      });

      // 2. Update payment transaction record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.grandTotal,
          currency: 'PKR',
          provider: 'STRIPE',
          transactionId: verification.transactionId || null,
          status: verification.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
          rawResponseJson: payload,
        },
      });
    });

    return NextResponse.json({ received: true, status: verification.status });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failure' }, { status: 500 });
  }
}
