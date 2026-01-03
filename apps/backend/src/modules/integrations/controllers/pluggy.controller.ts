import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PluggyService } from '../services/pluggy.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Open Banking (Pluggy)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations/pluggy')
export class PluggyController {
  constructor(private pluggyService: PluggyService) {}

  /**
   * Cria um connect token para inicializar o widget do Pluggy
   */
  @Post('connect-token')
  @ApiOperation({
    summary: 'Create Pluggy Connect Token',
    description: 'Creates a token to initialize the Pluggy Connect widget',
  })
  async createConnectToken(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.pluggyService.createConnectToken(userId);
  }

  /**
   * Lista todas as conexões bancárias do usuário
   */
  @Get('items')
  @ApiOperation({
    summary: 'List bank connections',
    description: 'Lists all Pluggy items (bank connections) for the user',
  })
  async getItems(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.pluggyService.getItems(userId);
  }

  /**
   * Obtém detalhes de uma conexão específica
   */
  @Get('items/:itemId')
  @ApiOperation({
    summary: 'Get bank connection details',
    description: 'Gets details of a specific Pluggy item',
  })
  async getItem(@Param('itemId') itemId: string) {
    return this.pluggyService.getItem(itemId);
  }

  /**
   * Deleta uma conexão bancária
   */
  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'Delete bank connection',
    description: 'Deletes a Pluggy item (disconnects bank)',
  })
  async deleteItem(@Param('itemId') itemId: string) {
    await this.pluggyService.deleteItem(itemId);
    return { message: 'Item deleted successfully' };
  }

  /**
   * Lista contas de uma conexão
   */
  @Get('items/:itemId/accounts')
  @ApiOperation({
    summary: 'List accounts from connection',
    description: 'Lists all accounts from a Pluggy item',
  })
  async getAccounts(@Param('itemId') itemId: string) {
    return this.pluggyService.getAccounts(itemId);
  }

  /**
   * Sincroniza contas do Pluggy com o sistema
   */
  @Post('items/:itemId/sync-accounts')
  @ApiOperation({
    summary: 'Sync accounts',
    description: 'Syncs accounts from Pluggy to the local database',
  })
  async syncAccounts(@Req() req: Request, @Param('itemId') itemId: string) {
    const userId = (req.user as any).id;
    const synced = await this.pluggyService.syncAccounts(userId, itemId);
    return {
      message: `Successfully synced ${synced} accounts`,
      synced,
    };
  }

  /**
   * Lista transações de uma conta
   */
  @Get('accounts/:accountId/transactions')
  @ApiOperation({
    summary: 'List transactions',
    description: 'Lists transactions from a Pluggy account',
  })
  async getTransactions(
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    return this.pluggyService.getTransactions(accountId, fromDate, toDate);
  }

  /**
   * Sincroniza transações de uma conta
   */
  @Post('accounts/:accountId/sync-transactions')
  @ApiOperation({
    summary: 'Sync transactions',
    description: 'Syncs transactions from Pluggy to the local database',
  })
  async syncTransactions(
    @Req() req: Request,
    @Param('accountId') accountId: string,
    @Body('pluggyAccountId') pluggyAccountId: string,
    @Body('days') days?: number
  ) {
    const userId = (req.user as any).id;
    const synced = await this.pluggyService.syncTransactions(
      userId,
      accountId,
      pluggyAccountId,
      days || 30
    );

    return {
      message: `Successfully synced ${synced} transactions`,
      synced,
    };
  }

  /**
   * Webhook endpoint para receber notificações do Pluggy
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Pluggy webhook',
    description: 'Receives webhook notifications from Pluggy',
  })
  async handleWebhook(@Body() body: any) {
    const { event, data } = body;
    await this.pluggyService.handleWebhook(event, data);
    return { received: true };
  }
}
