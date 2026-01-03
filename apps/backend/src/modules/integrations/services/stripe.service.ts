import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../../prisma/prisma.service';

export interface CreateCheckoutSessionDto {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}

export interface CreateCustomerDto {
  email: string;
  name: string;
  userId: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_dummy', {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Cria um customer no Stripe
   */
  async createCustomer(dto: CreateCustomerDto): Promise<string> {
    try {
      const customer = await this.stripe.customers.create({
        email: dto.email,
        name: dto.name,
        metadata: {
          userId: dto.userId,
        },
      });

      // Salva o Stripe customer ID no banco
      await this.prisma.user.update({
        where: { id: dto.userId },
        data: {
          // Adicionar campo stripeCustomerId no schema se necessário
          // stripeCustomerId: customer.id,
        },
      });

      return customer.id;
    } catch (error) {
      this.logger.error('Failed to create Stripe customer', error);
      throw new BadRequestException('Failed to create customer');
    }
  }

  /**
   * Cria uma sessão de checkout
   */
  async createCheckoutSession(dto: CreateCheckoutSessionDto): Promise<Stripe.Checkout.Session> {
    try {
      // Busca ou cria customer
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Criar customer se não existir
      // const customerId = user.stripeCustomerId || await this.createCustomer({
      //   email: user.email,
      //   name: user.name,
      //   userId: user.id,
      // });

      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: dto.priceId,
            quantity: 1,
          },
        ],
        success_url: dto.successUrl,
        cancel_url: dto.cancelUrl,
        // customer: customerId,
        metadata: {
          userId: dto.userId,
        },
      });

      return session;
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw new BadRequestException('Failed to create checkout session');
    }
  }

  /**
   * Cria um portal de gerenciamento de assinatura
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return session;
    } catch (error) {
      this.logger.error('Failed to create billing portal session', error);
      throw new BadRequestException('Failed to create billing portal session');
    }
  }

  /**
   * Lista todas as assinaturas de um customer
   */
  async getSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
      });

      return subscriptions.data;
    } catch (error) {
      this.logger.error('Failed to get subscriptions', error);
      return [];
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Lista produtos disponíveis
   */
  async getProducts(): Promise<Stripe.Product[]> {
    try {
      const products = await this.stripe.products.list({
        active: true,
      });

      return products.data;
    } catch (error) {
      this.logger.error('Failed to get products', error);
      return [];
    }
  }

  /**
   * Lista preços de um produto
   */
  async getPrices(productId?: string): Promise<Stripe.Price[]> {
    try {
      const prices = await this.stripe.prices.list({
        product: productId,
        active: true,
      });

      return prices.data;
    } catch (error) {
      this.logger.error('Failed to get prices', error);
      return [];
    }
  }

  /**
   * Cria um Payment Intent para pagamento único
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'brl',
    userId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Converte para centavos
        currency,
        metadata: {
          userId,
        },
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  /**
   * Webhook handler para eventos do Stripe
   */
  async handleWebhook(signature: string, rawBody: Buffer): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.warn('Stripe webhook secret not configured');
      return;
    }

    try {
      const event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      this.logger.log(`Received Stripe webhook: ${event.type}`);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.warn(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    this.logger.log(`Checkout completed for session: ${session.id}`);

    const userId = session.metadata?.userId;
    if (!userId) return;

    // Criar notificação
    await this.prisma.notification.create({
      data: {
        userId,
        title: 'Assinatura Ativada',
        message: 'Sua assinatura foi ativada com sucesso!',
        type: 'SUCCESS',
      },
    });
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription created: ${subscription.id}`);
    // Implementar lógica de criação de assinatura
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription updated: ${subscription.id}`);
    // Implementar lógica de atualização de assinatura
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    this.logger.log(`Subscription deleted: ${subscription.id}`);

    // Remover role PREMIUM do usuário
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: { set: ['USER'] },
      },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    this.logger.log(`Invoice paid: ${invoice.id}`);
    // Implementar lógica de invoice pago
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    this.logger.error(`Invoice payment failed: ${invoice.id}`);

    // Notificar usuário sobre falha no pagamento
    const customerId = invoice.customer as string;
    if (!customerId) return;

    // Buscar usuário pelo customerId e criar notificação
    // await this.prisma.notification.create(...)
  }
}
