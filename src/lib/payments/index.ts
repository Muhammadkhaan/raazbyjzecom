import { CashOnDeliveryAdapter } from './cod-adapter';
import { StripePaymentAdapter } from './stripe-adapter';
import { PaymentProviderAdapter } from './payment-types';

const adapters: Record<string, PaymentProviderAdapter> = {
  CASH_ON_DELIVERY: new CashOnDeliveryAdapter(),
  STRIPE: new StripePaymentAdapter(),
};

export function getPaymentAdapter(method: string): PaymentProviderAdapter | null {
  return adapters[method.toUpperCase()] || null;
}

export async function getAvailablePaymentMethods(): Promise<
  { code: string; title: string; isConfigured: boolean; description: string }[]
> {
  const cod = adapters.CASH_ON_DELIVERY;
  const stripe = adapters.STRIPE;

  const [codAvailable, stripeAvailable] = await Promise.all([
    cod.isAvailable(),
    stripe.isAvailable(),
  ]);

  return [
    {
      code: 'CASH_ON_DELIVERY',
      title: 'Cash on Delivery (COD)',
      isConfigured: codAvailable,
      description: 'Pay with cash upon receipt at your doorstep across Pakistan.',
    },
    {
      code: 'STRIPE',
      title: 'Credit / Debit Card (Online)',
      isConfigured: stripeAvailable,
      description: stripeAvailable
        ? 'Secure Visa, MasterCard, & American Express processing.'
        : 'Requires STRIPE_SECRET_KEY configuration in environment.',
    },
  ];
}
