import {
  PaymentProvider,
  CreatePaymentData,
  PaymentResult,
  RefundData,
  RefundResult,
  PaymentStatus,
  PaymentMethod,
} from './payment.interface';

/**
 * Configuração do Stripe
 */
export interface StripeConfig {
  secretKey: string;
  publicKey?: string;
  apiVersion?: string;
}

/**
 * Provider de pagamentos usando Stripe
 */
export class StripePaymentProvider implements PaymentProvider {
  public readonly name = 'Stripe';
  private config: StripeConfig;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(config: StripeConfig) {
    this.config = config;
  }

  /**
   * Cria um novo pagamento
   */
  public async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      // Cria um PaymentIntent no Stripe
      const paymentIntent = await this.createPaymentIntent({
        amount: data.amount,
        currency: data.currency || 'brl',
        description: data.description,
        metadata: data.metadata,
      });

      // Mapeia para nosso formato
      return this.mapToPaymentResult(paymentIntent, data);
    } catch (error) {
      throw new Error(`Erro ao criar pagamento no Stripe: ${(error as Error).message}`);
    }
  }

  /**
   * Busca informações de um pagamento
   */
  public async getPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const paymentIntent = await response.json();
      return this.mapToPaymentResult(paymentIntent);
    } catch (error) {
      throw new Error(`Erro ao buscar pagamento no Stripe: ${(error as Error).message}`);
    }
  }

  /**
   * Cancela um pagamento pendente
   */
  public async cancelPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentId}/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const paymentIntent = await response.json();
      return this.mapToPaymentResult(paymentIntent);
    } catch (error) {
      throw new Error(`Erro ao cancelar pagamento no Stripe: ${(error as Error).message}`);
    }
  }

  /**
   * Reembolsa um pagamento
   */
  public async refundPayment(data: RefundData): Promise<RefundResult> {
    try {
      const body = new URLSearchParams({
        payment_intent: data.paymentId,
        ...(data.amount && { amount: String(data.amount) }),
        ...(data.reason && { reason: data.reason }),
      });

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: this.getHeaders(),
        body,
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const refund = await response.json();

      return {
        id: refund.id,
        paymentId: data.paymentId,
        amount: refund.amount,
        status: this.mapStripeRefundStatus(refund.status),
        createdAt: new Date(refund.created * 1000),
      };
    } catch (error) {
      throw new Error(`Erro ao reembolsar pagamento no Stripe: ${(error as Error).message}`);
    }
  }

  /**
   * Lista pagamentos
   */
  public async listPayments(filters?: {
    status?: PaymentStatus;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<PaymentResult[]> {
    try {
      const params = new URLSearchParams({
        limit: String(filters?.limit || 10),
        ...(filters?.customerId && { customer: filters.customerId }),
        ...(filters?.startDate && {
          created: JSON.stringify({ gte: Math.floor(filters.startDate.getTime() / 1000) }),
        }),
      });

      const response = await fetch(`${this.baseUrl}/payment_intents?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Stripe API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((pi: any) => this.mapToPaymentResult(pi));
    } catch (error) {
      throw new Error(`Erro ao listar pagamentos no Stripe: ${(error as Error).message}`);
    }
  }

  /**
   * Cria um PaymentIntent no Stripe
   */
  private async createPaymentIntent(data: {
    amount: number;
    currency: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    const body = new URLSearchParams({
      amount: String(data.amount),
      currency: data.currency,
      ...(data.description && { description: data.description }),
      ...(data.metadata && { metadata: JSON.stringify(data.metadata) }),
    });

    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: this.getHeaders(),
      body,
    });

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Mapeia PaymentIntent do Stripe para PaymentResult
   */
  private mapToPaymentResult(paymentIntent: any, originalData?: CreatePaymentData): PaymentResult {
    return {
      id: paymentIntent.id,
      status: this.mapStripeStatus(paymentIntent.status),
      amount: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      method: originalData?.method || PaymentMethod.CREDIT_CARD,
      customer: originalData?.customer || {
        name: 'Unknown',
        email: 'unknown@example.com',
      },
      createdAt: new Date(paymentIntent.created * 1000),
      updatedAt: new Date(),
      providerData: paymentIntent,
    };
  }

  /**
   * Mapeia status do Stripe para nosso enum
   */
  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      requires_payment_method: PaymentStatus.PENDING,
      requires_confirmation: PaymentStatus.PENDING,
      requires_action: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.SUCCEEDED,
      canceled: PaymentStatus.CANCELED,
    };

    return statusMap[stripeStatus] || PaymentStatus.FAILED;
  }

  /**
   * Mapeia status de reembolso do Stripe
   */
  private mapStripeRefundStatus(stripeStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.REFUNDED,
      failed: PaymentStatus.FAILED,
      canceled: PaymentStatus.CANCELED,
    };

    return statusMap[stripeStatus] || PaymentStatus.FAILED;
  }

  /**
   * Headers para requisições ao Stripe
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(this.config.apiVersion && { 'Stripe-Version': this.config.apiVersion }),
    };
  }
}
