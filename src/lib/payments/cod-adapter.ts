import { db } from '@/lib/db';
import { PaymentProviderAdapter, PaymentResult } from './payment-types';

export class CashOnDeliveryAdapter implements PaymentProviderAdapter {
  name = 'CASH_ON_DELIVERY';

  async isAvailable(): Promise<boolean> {
    const setting = await db.storeSetting.findUnique({
      where: { key: 'ENABLE_CASH_ON_DELIVERY' },
    });
    return setting ? setting.value === 'true' : true;
  }

  async initiatePayment(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
  }): Promise<PaymentResult> {
    const available = await this.isAvailable();
    if (!available) {
      return {
        provider: this.name,
        transactionId: '',
        status: 'FAILED',
        requiresAction: false,
        instructions: 'Cash on delivery is currently disabled by store settings.',
      };
    }

    const transactionId = `COD-${params.orderNumber}`;

    return {
      provider: this.name,
      transactionId,
      status: 'PENDING', // Payment is collected upon physical delivery
      requiresAction: false,
      instructions: `Please keep exact cash amount (${params.currency} ${params.amount.toLocaleString()}) ready at the time of delivery. Our courier representative will provide an official receipt.`,
    };
  }
}
