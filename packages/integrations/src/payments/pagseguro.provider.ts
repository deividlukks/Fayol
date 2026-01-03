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
 * Configuração do PagSeguro
 */
export interface PagSeguroConfig {
  email: string;
  token: string;
  sandbox?: boolean;
}

/**
 * Provider de pagamentos usando PagSeguro
 */
export class PagSeguroPaymentProvider implements PaymentProvider {
  public readonly name = 'PagSeguro';
  private config: PagSeguroConfig;
  private baseUrl: string;

  constructor(config: PagSeguroConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? 'https://ws.sandbox.pagseguro.uol.com.br'
      : 'https://ws.pagseguro.uol.com.br';
  }

  /**
   * Cria um novo pagamento
   */
  public async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      let result: PaymentResult;

      switch (data.method) {
        case PaymentMethod.PIX:
          result = await this.createPixPayment(data);
          break;
        case PaymentMethod.BOLETO:
          result = await this.createBoletoPayment(data);
          break;
        case PaymentMethod.CREDIT_CARD:
          result = await this.createCreditCardPayment(data);
          break;
        default:
          throw new Error(`Método de pagamento não suportado: ${data.method}`);
      }

      return result;
    } catch (error) {
      throw new Error(`Erro ao criar pagamento no PagSeguro: ${(error as Error).message}`);
    }
  }

  /**
   * Busca informações de um pagamento
   */
  public async getPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/transactions/${paymentId}?email=${this.config.email}&token=${this.config.token}`
      );

      if (!response.ok) {
        throw new Error(`PagSeguro API error: ${response.statusText}`);
      }

      const xml = await response.text();
      return this.parsePaymentXml(xml);
    } catch (error) {
      throw new Error(`Erro ao buscar pagamento no PagSeguro: ${(error as Error).message}`);
    }
  }

  /**
   * Cancela um pagamento pendente
   */
  public async cancelPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v2/transactions/cancels?email=${this.config.email}&token=${this.config.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `transactionCode=${paymentId}`,
        }
      );

      if (!response.ok) {
        throw new Error(`PagSeguro API error: ${response.statusText}`);
      }

      return await this.getPayment(paymentId);
    } catch (error) {
      throw new Error(`Erro ao cancelar pagamento no PagSeguro: ${(error as Error).message}`);
    }
  }

  /**
   * Reembolsa um pagamento
   */
  public async refundPayment(data: RefundData): Promise<RefundResult> {
    try {
      const body = new URLSearchParams({
        transactionCode: data.paymentId,
        ...(data.amount && { refundValue: (data.amount / 100).toFixed(2) }),
      });

      const response = await fetch(
        `${this.baseUrl}/v2/transactions/refunds?email=${this.config.email}&token=${this.config.token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        }
      );

      if (!response.ok) {
        throw new Error(`PagSeguro API error: ${response.statusText}`);
      }

      const xml = await response.text();
      const refundId = this.extractXmlValue(xml, 'refundId');

      return {
        id: refundId,
        paymentId: data.paymentId,
        amount: data.amount || 0,
        status: PaymentStatus.REFUNDED,
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Erro ao reembolsar pagamento no PagSeguro: ${(error as Error).message}`);
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
        email: this.config.email,
        token: this.config.token,
        page: '1',
        maxPageResults: String(filters?.limit || 10),
        ...(filters?.startDate && {
          initialDate: filters.startDate.toISOString().split('T')[0],
        }),
        ...(filters?.endDate && {
          finalDate: filters.endDate.toISOString().split('T')[0],
        }),
      });

      const response = await fetch(`${this.baseUrl}/v2/transactions?${params}`);

      if (!response.ok) {
        throw new Error(`PagSeguro API error: ${response.statusText}`);
      }

      const xml = await response.text();
      return this.parseTransactionListXml(xml);
    } catch (error) {
      throw new Error(`Erro ao listar pagamentos no PagSeguro: ${(error as Error).message}`);
    }
  }

  /**
   * Cria pagamento PIX
   */
  private async createPixPayment(data: CreatePaymentData): Promise<PaymentResult> {
    const paymentData = {
      qrCodeExpirationDate: this.calculatePixExpiration(data.pixExpirationMinutes),
      amount: (data.amount / 100).toFixed(2),
      customer: data.customer,
      description: data.description,
    };

    const response = await fetch(
      `${this.baseUrl}/instant-payments/cob?email=${this.config.email}&token=${this.config.token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      }
    );

    if (!response.ok) {
      throw new Error(`PagSeguro API error: ${response.statusText}`);
    }

    const result = await response.json();

    return {
      id: result.txId || result.id,
      status: PaymentStatus.PENDING,
      amount: data.amount,
      currency: 'BRL',
      method: PaymentMethod.PIX,
      customer: data.customer,
      createdAt: new Date(),
      updatedAt: new Date(),
      qrCode: result.qrCode,
      paymentUrl: result.paymentLink,
      providerData: result,
    };
  }

  /**
   * Cria pagamento via boleto
   */
  private async createBoletoPayment(data: CreatePaymentData): Promise<PaymentResult> {
    const xml = this.buildBoletoXml(data);

    const response = await fetch(
      `${this.baseUrl}/v2/transactions?email=${this.config.email}&token=${this.config.token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      }
    );

    if (!response.ok) {
      throw new Error(`PagSeguro API error: ${response.statusText}`);
    }

    const responseXml = await response.text();
    const paymentCode = this.extractXmlValue(responseXml, 'code');
    const paymentLink = this.extractXmlValue(responseXml, 'paymentLink');

    return {
      id: paymentCode,
      status: PaymentStatus.PENDING,
      amount: data.amount,
      currency: 'BRL',
      method: PaymentMethod.BOLETO,
      customer: data.customer,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentUrl: paymentLink,
      providerData: { xml: responseXml },
    };
  }

  /**
   * Cria pagamento com cartão de crédito
   */
  private async createCreditCardPayment(data: CreatePaymentData): Promise<PaymentResult> {
    if (!data.card) {
      throw new Error('Dados do cartão são obrigatórios para pagamento com cartão');
    }

    const xml = this.buildCreditCardXml(data);

    const response = await fetch(
      `${this.baseUrl}/v2/transactions?email=${this.config.email}&token=${this.config.token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      }
    );

    if (!response.ok) {
      throw new Error(`PagSeguro API error: ${response.statusText}`);
    }

    const responseXml = await response.text();
    return this.parsePaymentXml(responseXml);
  }

  /**
   * Constrói XML para pagamento com boleto
   */
  private buildBoletoXml(data: CreatePaymentData): string {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + (data.boletoExpirationDays || 3));

    return `<?xml version="1.0" encoding="UTF-8"?>
<payment>
  <mode>default</mode>
  <method>boleto</method>
  <currency>BRL</currency>
  <items>
    <item>
      <id>1</id>
      <description>${data.description || 'Pagamento'}</description>
      <amount>${(data.amount / 100).toFixed(2)}</amount>
      <quantity>1</quantity>
    </item>
  </items>
  <sender>
    <name>${data.customer.name}</name>
    <email>${data.customer.email}</email>
  </sender>
</payment>`;
  }

  /**
   * Constrói XML para pagamento com cartão
   */
  private buildCreditCardXml(data: CreatePaymentData): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<payment>
  <mode>default</mode>
  <method>creditCard</method>
  <currency>BRL</currency>
  <items>
    <item>
      <id>1</id>
      <description>${data.description || 'Pagamento'}</description>
      <amount>${(data.amount / 100).toFixed(2)}</amount>
      <quantity>1</quantity>
    </item>
  </items>
  <sender>
    <name>${data.customer.name}</name>
    <email>${data.customer.email}</email>
  </sender>
  <creditCard>
    <token>${data.card?.number}</token>
  </creditCard>
</payment>`;
  }

  /**
   * Faz parsing de XML de pagamento
   */
  private parsePaymentXml(xml: string): PaymentResult {
    const id = this.extractXmlValue(xml, 'code');
    const status = this.mapPagSeguroStatus(this.extractXmlValue(xml, 'status'));
    const amount = parseFloat(this.extractXmlValue(xml, 'grossAmount')) * 100;

    return {
      id,
      status,
      amount,
      currency: 'BRL',
      method: PaymentMethod.CREDIT_CARD,
      customer: {
        name: this.extractXmlValue(xml, 'name'),
        email: this.extractXmlValue(xml, 'email'),
      },
      createdAt: new Date(this.extractXmlValue(xml, 'date')),
      updatedAt: new Date(this.extractXmlValue(xml, 'lastEventDate')),
      providerData: { xml },
    };
  }

  /**
   * Faz parsing de lista de transações
   */
  private parseTransactionListXml(xml: string): PaymentResult[] {
    const transactions: PaymentResult[] = [];
    const regex = /<transaction>(.*?)<\/transaction>/gs;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      try {
        transactions.push(this.parsePaymentXml(match[1]));
      } catch (error) {
        // Ignora erros de parsing individual
      }
    }

    return transactions;
  }

  /**
   * Extrai valor de tag XML
   */
  private extractXmlValue(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, 's');
    const match = xml.match(regex);
    return match ? match[1] : '';
  }

  /**
   * Mapeia status do PagSeguro para nosso enum
   */
  private mapPagSeguroStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      '1': PaymentStatus.PENDING, // Aguardando pagamento
      '2': PaymentStatus.PROCESSING, // Em análise
      '3': PaymentStatus.SUCCEEDED, // Paga
      '4': PaymentStatus.SUCCEEDED, // Disponível
      '5': PaymentStatus.PROCESSING, // Em disputa
      '6': PaymentStatus.REFUNDED, // Devolvida
      '7': PaymentStatus.CANCELED, // Cancelada
    };

    return statusMap[status] || PaymentStatus.FAILED;
  }

  /**
   * Calcula data de expiração do PIX
   */
  private calculatePixExpiration(minutes?: number): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() + (minutes || 30));
    return date.toISOString();
  }
}
