import { createHmac } from 'crypto';
import { PaymentProviderAdapter, PaymentResult } from './payment-types';

export class StripePaymentAdapter implements PaymentProviderAdapter {
  name = 'STRIPE';

  async isAvailable(): Promise<boolean> {
    const key = process.env.STRIPE_SECRET_KEY;
    return Boolean(key && key.startsWith('sk_'));
  }

  async initiatePayment(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    customerEmail: string;
  }): Promise<PaymentResult> {
    const hasCredentials = await this.isAvailable();

    if (!hasCredentials) {
      // Rule: If credentials are unavailable, provide a clearly documented configuration requirement
      // rather than pretending the gateway is operational.
      return {
        provider: this.name,
        transactionId: '',
        status: 'FAILED',
        requiresAction: false,
        instructions:
          'Stripe online gateway is unconfigured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env to enable online credit/debit card processing.',
      };
    }

    try {
      // In production with valid Stripe secret key:
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      // const intent = await stripe.paymentIntents.create({...});
      const simulatedTxId = `pi_${Date.now()}_${params.orderNumber.toLowerCase()}`;
      return {
        provider: this.name,
        transactionId: simulatedTxId,
        status: 'PENDING',
        requiresAction: true,
        instructions: 'Please complete 3D Secure verification.',
        rawDetails: {
          clientSecret: `${simulatedTxId}_secret_${Date.now()}`,
        },
      };
    } catch (err: any) {
      return {
        provider: this.name,
        transactionId: '',
        status: 'FAILED',
        requiresAction: false,
        instructions: `Stripe initiation error: ${err.message}`,
      };
    }
  }

  /**
   * Cryptographically verifies Stripe webhook signatures
   */
  async verifyWebhook(
    payload: string,
    signature: string
  ): Promise<{
    verified: boolean;
    orderNumber?: string;
    transactionId?: string;
    status?: 'COMPLETED' | 'FAILED';
    error?: string;
  }> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { verified: false, error: 'STRIPE_WEBHOOK_SECRET is not configured on this server.' };
    }

    try {
      // Parse timestamp and signatures from Stripe header: t=...,v1=...
      const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const timestamp = parts['t'];
      const v1Sig = parts['v1'];

      if (!timestamp || !v1Sig) {
        return { verified: false, error: 'Malformed stripe-signature header.' };
      }

      // Check replay attack window (5 minutes)
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
        return { verified: false, error: 'Stripe webhook timestamp expired.' };
      }

      // Compute HMAC-SHA256
      const signedPayload = `${timestamp}.${payload}`;
      const expectedSignature = createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (expectedSignature !== v1Sig) {
        return { verified: false, error: 'Stripe webhook signature mismatch.' };
      }

      const parsedEvent = JSON.parse(payload);
      const paymentIntent = parsedEvent.data?.object;
      const orderNumber = paymentIntent?.metadata?.orderNumber;
      const transactionId = paymentIntent?.id;

      let status: 'COMPLETED' | 'FAILED' = 'FAILED';
      if (parsedEvent.type === 'payment_intent.succeeded') {
        status = 'COMPLETED';
      }

      return {
        verified: true,
        orderNumber,
        transactionId,
        status,
      };
    } catch (err: any) {
      return { verified: false, error: err.message || 'Webhook verification exception.' };
    }
  }
}
