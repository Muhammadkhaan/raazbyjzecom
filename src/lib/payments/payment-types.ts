export interface PaymentResult {
  provider: string;
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  instructions?: string;
  redirectUrl?: string;
  clientSecret?: string;
  requiresAction: boolean;
  rawDetails?: Record<string, any>;
}

export interface PaymentProviderAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  initiatePayment(params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    currency: string;
    customerEmail: string;
  }): Promise<PaymentResult>;
  verifyWebhook?(
    payload: string,
    signature: string
  ): Promise<{
    verified: boolean;
    orderNumber?: string;
    transactionId?: string;
    status?: 'COMPLETED' | 'FAILED';
    error?: string;
  }>;
}
