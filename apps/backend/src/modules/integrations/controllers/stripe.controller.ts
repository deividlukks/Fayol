import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StripeService, CreateCheckoutSessionDto } from '../services/stripe.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Payments (Stripe)')
@Controller('integrations/stripe')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  /**
   * Cria uma sessão de checkout
   */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create checkout session',
    description: 'Creates a Stripe checkout session for subscription',
  })
  async createCheckout(
    @Req() req: Request,
    @Body() body: Omit<CreateCheckoutSessionDto, 'userId'>
  ) {
    const userId = (req.user as any).id;
    const session = await this.stripeService.createCheckoutSession({
      ...body,
      userId,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Cria um portal de gerenciamento de assinatura
   */
  @Post('billing-portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create billing portal session',
    description: 'Creates a session for the Stripe billing portal',
  })
  async createBillingPortal(
    @Body('customerId') customerId: string,
    @Body('returnUrl') returnUrl: string
  ) {
    const session = await this.stripeService.createBillingPortalSession(customerId, returnUrl);

    return {
      url: session.url,
    };
  }

  /**
   * Lista produtos disponíveis
   */
  @Get('products')
  @ApiOperation({
    summary: 'List products',
    description: 'Lists all active Stripe products',
  })
  async getProducts() {
    return this.stripeService.getProducts();
  }

  /**
   * Lista preços
   */
  @Get('prices')
  @ApiOperation({
    summary: 'List prices',
    description: 'Lists all active Stripe prices',
  })
  async getPrices(@Body('productId') productId?: string) {
    return this.stripeService.getPrices(productId);
  }

  /**
   * Lista assinaturas do usuário
   */
  @Get('subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List subscriptions',
    description: 'Lists all subscriptions for the current user',
  })
  async getSubscriptions(@Body('customerId') customerId: string) {
    return this.stripeService.getSubscriptions(customerId);
  }

  /**
   * Cancela uma assinatura
   */
  @Delete('subscriptions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancels a Stripe subscription',
  })
  async cancelSubscription(@Param('id') subscriptionId: string) {
    return this.stripeService.cancelSubscription(subscriptionId);
  }

  /**
   * Cria um Payment Intent
   */
  @Post('payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payment intent',
    description: 'Creates a Stripe Payment Intent for one-time payment',
  })
  async createPaymentIntent(
    @Req() req: Request,
    @Body('amount') amount: number,
    @Body('currency') currency: string = 'brl'
  ) {
    const userId = (req.user as any).id;
    const paymentIntent = await this.stripeService.createPaymentIntent(amount, currency, userId);

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  /**
   * Webhook endpoint para eventos do Stripe
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Stripe webhook',
    description: 'Receives webhook events from Stripe',
  })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      throw new Error('Missing raw body');
    }

    await this.stripeService.handleWebhook(signature, rawBody);

    return { received: true };
  }
}
