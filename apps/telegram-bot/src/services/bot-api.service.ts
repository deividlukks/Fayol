/**
 * Serviço de API refinado para o Bot Telegram
 * Usa os pacotes compartilhados do monorepo
 */

import axios, { AxiosInstance } from 'axios';
import type {
  ApiResponse,
  Transaction,
  Account,
  User,
} from '@fayol/shared-types';
import { LaunchType, Recurrence } from '@fayol/shared-types';
import type { CreateTransactionInput } from '@fayol/validation-schemas';
import { CategorizerService } from '@fayol/ai-services';

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3333/api';

console.log(`🔌 [Bot] API Service configurado para: ${BASE_URL}`);

interface LoginResponse {
  access_token: string;
  user: User;
}

interface CheckUserResponse {
  exists: boolean;
  name?: string;
  email?: string;
}

interface DashboardSummary {
  totalBalance: number;
  periodSummary: {
    income: number;
    expense: number;
    result: number;
  };
}

interface CategoryExpense {
  name: string;
  icon?: string;
  amount: number;
}

interface Insight {
  type: 'warning' | 'success' | 'info';
  text: string;
}

/**
 * Serviço de API otimizado para o bot Telegram
 * Integra com pacotes compartilhados do monorepo
 */
export class BotApiService {
  private api: AxiosInstance;
  private categorizer: CategorizerService;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Inicializa categorizador de IA local
    this.categorizer = new CategorizerService();
  }

  // =====================================
  // AUTENTICAÇÃO & USUÁRIO
  // =====================================

  async checkUser(identifier: string): Promise<boolean> {
    try {
      console.log(`📡 [Bot] Consultando usuário: "${identifier}"...`);
      const response = await this.api.post<ApiResponse<CheckUserResponse>>(
        '/auth/check',
        { identifier }
      );

      const payload = response.data;
      const data = payload.data || payload;
      return (data as CheckUserResponse).exists ?? false;
    } catch (error) {
      this.handleError(error, 'checkUser');
      throw error;
    }
  }

  async login(identifier: string, password: string): Promise<LoginResponse | null> {
    try {
      const response = await this.api.post<ApiResponse<LoginResponse>>('/auth/login', {
        email: identifier,
        password,
      });
      const payload = response.data;
      return (payload.data || payload) as LoginResponse;
    } catch (error) {
      this.handleError(error, 'login');
      return null;
    }
  }

  async updateOnboarding(
    token: string,
    data: { step: number; name?: string; investorProfile?: string }
  ): Promise<User> {
    try {
      const response = await this.api.patch<ApiResponse<User>>('/users/onboarding/step', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data!;
    } catch (error) {
      this.handleError(error, 'updateOnboarding');
      throw new Error('Falha ao atualizar perfil.');
    }
  }

  // =====================================
  // CONTAS
  // =====================================

  async createAccount(
    token: string,
    data: { name: string; type: string; balance: number; currency?: string }
  ): Promise<Account> {
    try {
      const response = await this.api.post<ApiResponse<Account>>(
        '/accounts',
        {
          ...data,
          currency: data.currency || 'BRL',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data!;
    } catch (error) {
      this.handleError(error, 'createAccount');
      throw new Error('Falha ao criar conta.');
    }
  }

  async getAccounts(token: string): Promise<Account[]> {
    try {
      const response = await this.api.get<ApiResponse<Account[]>>('/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || [];
    } catch (error) {
      this.handleError(error, 'getAccounts');
      throw error;
    }
  }

  async getFirstAccountId(token: string): Promise<string> {
    const accounts = await this.getAccounts(token);
    if (!accounts || accounts.length === 0) {
      throw new Error('Nenhuma conta encontrada.');
    }
    return accounts[0].id;
  }

  // =====================================
  // TRANSAÇÕES (com tipagem forte)
  // =====================================

  async createTransaction(
    token: string,
    description: string,
    amount: number,
    type: LaunchType = LaunchType.EXPENSE
  ): Promise<Transaction> {
    try {
      const accountId = await this.getFirstAccountId(token);

      // Tenta sugerir categoria usando IA local
      let categoryId: string | null = null;
      try {
        const suggestedCategory = this.categorizer.predictCategory(description);
        console.log(`🤖 [Bot] Categoria sugerida pela IA: ${suggestedCategory || 'nenhuma'}`);
        // TODO: Buscar o ID da categoria pelo nome (requer endpoint de categorias)
      } catch (aiError) {
        console.warn('⚠️ [Bot] Falha ao sugerir categoria com IA local');
      }

      const transactionData: CreateTransactionInput = {
        description,
        amount,
        date: new Date(),
        type,
        isPaid: true,
        accountId,
        categoryId: categoryId || undefined,
        recurrence: Recurrence.NONE,
      };

      const response = await this.api.post<ApiResponse<Transaction>>(
        '/transactions',
        transactionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data.data!;
    } catch (error) {
      this.handleError(error, 'createTransaction');
      throw new Error(
        (error as any).response?.data?.message || 'Falha ao criar transação'
      );
    }
  }

  async getLastTransactions(token: string, limit: number = 5): Promise<Transaction[]> {
    try {
      const response = await this.api.get<ApiResponse<Transaction[]>>('/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactions = response.data.data || [];
      return transactions.slice(0, limit);
    } catch (error) {
      this.handleError(error, 'getLastTransactions');
      throw new Error('Não foi possível buscar o extrato.');
    }
  }

  // =====================================
  // RELATÓRIOS & INSIGHTS
  // =====================================

  async getDashboardSummary(token: string): Promise<DashboardSummary> {
    try {
      const response = await this.api.get<ApiResponse<DashboardSummary>>('/reports/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data!;
    } catch (error) {
      this.handleError(error, 'getDashboardSummary');
      throw new Error('Não foi possível buscar o saldo.');
    }
  }

  async getInsights(token: string): Promise<Insight[]> {
    try {
      const response = await this.api.get<ApiResponse<Insight[]>>('/reports/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || [];
    } catch (error) {
      this.handleError(error, 'getInsights');
      throw new Error('Não foi possível buscar insights.');
    }
  }

  async getExpensesByCategory(token: string): Promise<CategoryExpense[]> {
    try {
      const response = await this.api.get<ApiResponse<CategoryExpense[]>>(
        '/reports/expenses-by-category',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data || [];
    } catch (error) {
      this.handleError(error, 'getExpensesByCategory');
      throw new Error('Não foi possível buscar o relatório de categorias.');
    }
  }

  async downloadReport(token: string, type: 'PDF' | 'EXCEL'): Promise<ArrayBuffer> {
    try {
      const response = await this.api.get('/reports/export', {
        headers: { Authorization: `Bearer ${token}` },
        params: { type },
        responseType: 'arraybuffer',
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'downloadReport');
      throw new Error('Falha ao baixar o relatório.');
    }
  }

  // =====================================
  // HELPERS
  // =====================================

  private handleError(error: any, context: string): void {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`❌ [Bot] ${context}: Backend inacessível ou offline em ${BASE_URL}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`❌ [Bot] ${context}: Timeout! O Backend demorou mais de 30s.`);
    } else {
      console.error(`❌ [Bot] ${context}:`, error.response?.data || error.message);
    }
  }
}
