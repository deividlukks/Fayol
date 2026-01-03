import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountType } from '@fayol/shared-types';

interface PluggyConnectToken {
  accessToken: string;
}

interface PluggyItem {
  id: string;
  connector: {
    id: number;
    name: string;
  };
  status: string;
  executionStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface PluggyAccount {
  id: string;
  type: string;
  subtype: string;
  number: string;
  name: string;
  balance: number;
  currencyCode: string;
  itemId: string;
}

interface PluggyTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  accountId: string;
  type: 'DEBIT' | 'CREDIT';
}

@Injectable()
export class PluggyService {
  private readonly logger = new Logger(PluggyService.name);
  private readonly client: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.clientId = this.configService.get<string>('PLUGGY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PLUGGY_CLIENT_SECRET') || '';

    const baseURL = this.configService.get<string>('PLUGGY_API_URL') || 'https://api.pluggy.ai';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.client.interceptors.request.use(async (config) => {
      const apiKey = await this.getApiKey();
      if (apiKey) {
        config.headers['X-API-KEY'] = apiKey;
      }
      return config;
    });
  }

  /**
   * Obtém a API Key (em produção, deveria fazer autenticação OAuth)
   */
  private async getApiKey(): Promise<string> {
    // Em produção, implementar autenticação OAuth completa
    // Por enquanto, usa a chave diretamente
    return this.clientId;
  }

  /**
   * Cria um Connect Token para o widget do Pluggy
   */
  async createConnectToken(userId: string): Promise<PluggyConnectToken> {
    try {
      const response = await this.client.post('/connect_token', {
        clientUserId: userId,
      });

      return {
        accessToken: response.data.accessToken,
      };
    } catch (error) {
      this.logger.error('Failed to create connect token', error);
      throw new BadRequestException('Failed to create connect token');
    }
  }

  /**
   * Lista todos os itens (conexões bancárias) de um usuário
   */
  async getItems(userId: string): Promise<PluggyItem[]> {
    try {
      const response = await this.client.get('/items', {
        params: { clientUserId: userId },
      });

      return response.data.results || [];
    } catch (error) {
      this.logger.error('Failed to get items', error);
      return [];
    }
  }

  /**
   * Obtém detalhes de um item específico
   */
  async getItem(itemId: string): Promise<PluggyItem> {
    try {
      const response = await this.client.get(`/items/${itemId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get item ${itemId}`, error);
      throw new BadRequestException('Failed to get item');
    }
  }

  /**
   * Deleta uma conexão bancária
   */
  async deleteItem(itemId: string): Promise<void> {
    try {
      await this.client.delete(`/items/${itemId}`);
    } catch (error) {
      this.logger.error(`Failed to delete item ${itemId}`, error);
      throw new BadRequestException('Failed to delete item');
    }
  }

  /**
   * Lista as contas bancárias de um item
   */
  async getAccounts(itemId: string): Promise<PluggyAccount[]> {
    try {
      const response = await this.client.get('/accounts', {
        params: { itemId },
      });

      return response.data.results || [];
    } catch (error) {
      this.logger.error(`Failed to get accounts for item ${itemId}`, error);
      return [];
    }
  }

  /**
   * Obtém uma conta específica
   */
  async getAccount(accountId: string): Promise<PluggyAccount> {
    try {
      const response = await this.client.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get account ${accountId}`, error);
      throw new BadRequestException('Failed to get account');
    }
  }

  /**
   * Lista transações de uma conta
   */
  async getTransactions(accountId: string, from?: Date, to?: Date): Promise<PluggyTransaction[]> {
    try {
      const params: any = { accountId };

      if (from) {
        params.from = from.toISOString().split('T')[0];
      }
      if (to) {
        params.to = to.toISOString().split('T')[0];
      }

      const response = await this.client.get('/transactions', { params });

      return response.data.results || [];
    } catch (error) {
      this.logger.error(`Failed to get transactions for account ${accountId}`, error);
      return [];
    }
  }

  /**
   * Sincroniza contas do Pluggy com o banco de dados local
   */
  async syncAccounts(userId: string, itemId: string): Promise<number> {
    try {
      const pluggyAccounts = await this.getAccounts(itemId);
      let synced = 0;

      for (const pluggyAccount of pluggyAccounts) {
        // Verifica se a conta já existe
        const existingAccount = await this.prisma.account.findFirst({
          where: {
            userId,
            bankConnectionId: pluggyAccount.id,
          },
        });

        if (existingAccount) {
          // Atualiza o saldo
          await this.prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              balance: pluggyAccount.balance,
            },
          });
        } else {
          // Cria nova conta
          await this.prisma.account.create({
            data: {
              userId,
              name: pluggyAccount.name || `Conta ${pluggyAccount.number}`,
              type: this.mapAccountType(pluggyAccount.type),
              balance: pluggyAccount.balance,
              currency: pluggyAccount.currencyCode || 'BRL',
              bankConnectionId: pluggyAccount.id,
            },
          });
        }

        synced++;
      }

      return synced;
    } catch (error) {
      this.logger.error('Failed to sync accounts', error);
      throw new BadRequestException('Failed to sync accounts');
    }
  }

  /**
   * Sincroniza transações do Pluggy com o banco de dados local
   */
  async syncTransactions(
    userId: string,
    accountId: string,
    pluggyAccountId: string,
    days: number = 30
  ): Promise<number> {
    try {
      const from = new Date();
      from.setDate(from.getDate() - days);

      const pluggyTransactions = await this.getTransactions(pluggyAccountId, from);
      let synced = 0;

      for (const tx of pluggyTransactions) {
        // Verifica se a transação já existe (por ID externo ou data+valor+descrição)
        const existingTx = await this.prisma.transaction.findFirst({
          where: {
            userId,
            accountId,
            description: tx.description,
            amount: Math.abs(tx.amount),
            date: new Date(tx.date),
          },
        });

        if (!existingTx) {
          // Cria nova transação
          await this.prisma.transaction.create({
            data: {
              userId,
              accountId,
              description: tx.description,
              amount: Math.abs(tx.amount),
              date: new Date(tx.date),
              type: tx.type === 'CREDIT' ? 'INCOME' : 'EXPENSE',
              isPaid: true,
              // Poderia categorizar automaticamente aqui usando AI
            },
          });

          synced++;
        }
      }

      return synced;
    } catch (error) {
      this.logger.error('Failed to sync transactions', error);
      throw new BadRequestException('Failed to sync transactions');
    }
  }

  /**
   * Mapeia tipo de conta do Pluggy para o tipo do sistema
   */
  private mapAccountType(pluggyType: string): AccountType {
    const typeMap: Record<string, AccountType> = {
      CHECKING: AccountType.CHECKING,
      SAVINGS: AccountType.SAVINGS,
      CREDIT_CARD: AccountType.CREDIT_CARD,
      INVESTMENT: AccountType.INVESTMENT,
    };

    return typeMap[pluggyType] || AccountType.CHECKING;
  }

  /**
   * Webhook handler para atualizações do Pluggy
   */
  async handleWebhook(event: string, data: any): Promise<void> {
    this.logger.log(`Received Pluggy webhook: ${event}`);

    switch (event) {
      case 'item/created':
        await this.handleItemCreated(data);
        break;
      case 'item/updated':
        await this.handleItemUpdated(data);
        break;
      case 'item/error':
        await this.handleItemError(data);
        break;
      case 'transactions/updated':
        await this.handleTransactionsUpdated(data);
        break;
      default:
        this.logger.warn(`Unknown webhook event: ${event}`);
    }
  }

  private async handleItemCreated(data: any): Promise<void> {
    this.logger.log(`Item created: ${data.id}`);
    // Implementar lógica de sincronização automática se necessário
  }

  private async handleItemUpdated(data: any): Promise<void> {
    this.logger.log(`Item updated: ${data.id}`);
    // Atualizar status no banco de dados
  }

  private async handleItemError(data: any): Promise<void> {
    this.logger.error(`Item error: ${data.id}`, data.error);
    // Notificar usuário sobre erro na conexão
  }

  private async handleTransactionsUpdated(data: any): Promise<void> {
    this.logger.log(`Transactions updated for item: ${data.itemId}`);
    // Sincronizar transações automaticamente
  }
}
