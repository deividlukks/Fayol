/**
 * Status de um pagamento
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
}

/**
 * Método de pagamento
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BOLETO = 'boleto',
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * Informações do cliente
 */
export interface CustomerInfo {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  document?: string; // CPF/CNPJ
}

/**
 * Endereço de cobrança
 */
export interface BillingAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Dados do cartão
 */
export interface CardData {
  number: string;
  holderName: string;
  expirationMonth: number;
  expirationYear: number;
  cvv: string;
}

/**
 * Dados para criar um pagamento
 */
export interface CreatePaymentData {
  amount: number; // Em centavos
  currency?: string; // Default: BRL
  method: PaymentMethod;
  customer: CustomerInfo;
  description?: string;
  metadata?: Record<string, string>;

  // Específico para cartão
  card?: CardData;
  billingAddress?: BillingAddress;

  // Específico para PIX
  pixExpirationMinutes?: number;

  // Específico para boleto
  boletoExpirationDays?: number;
}

/**
 * Resultado de um pagamento
 */
export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customer: CustomerInfo;
  createdAt: Date;
  updatedAt: Date;

  // URLs ou informações adicionais
  paymentUrl?: string; // Para PIX ou boleto
  qrCode?: string; // Para PIX
  barcode?: string; // Para boleto

  // Dados do provedor
  providerData?: Record<string, any>;
}

/**
 * Dados para reembolso
 */
export interface RefundData {
  paymentId: string;
  amount?: number; // Opcional para reembolso parcial
  reason?: string;
}

/**
 * Resultado de reembolso
 */
export interface RefundResult {
  id: string;
  paymentId: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
}

/**
 * Interface base para provedores de pagamento
 */
export interface PaymentProvider {
  /**
   * Nome do provedor
   */
  readonly name: string;

  /**
   * Cria um novo pagamento
   */
  createPayment(data: CreatePaymentData): Promise<PaymentResult>;

  /**
   * Busca informações de um pagamento
   */
  getPayment(paymentId: string): Promise<PaymentResult>;

  /**
   * Cancela um pagamento pendente
   */
  cancelPayment(paymentId: string): Promise<PaymentResult>;

  /**
   * Reembolsa um pagamento
   */
  refundPayment(data: RefundData): Promise<RefundResult>;

  /**
   * Lista pagamentos
   */
  listPayments(filters?: {
    status?: PaymentStatus;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<PaymentResult[]>;
}
