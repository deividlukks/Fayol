import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3333/api';

console.log(`🔌 [Bot] API Service configurado para: ${BASE_URL}`);

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
    });
  }

  // --- AUTENTICAÇÃO & USUÁRIO ---

  async checkUser(identifier: string): Promise<boolean> {
    try {
      console.log(`📡 [Bot] Consultando usuário: "${identifier}"...`);
      const response = await this.api.post('/auth/check', { identifier });

      const payload = response.data;
      if (payload.data && typeof payload.data.exists === 'boolean') {
        return payload.data.exists;
      }
      return !!payload.exists;
    } catch (error: any) {
      this.handleError(error, 'checkUser');
      throw error;
    }
  }

  async login(identifier: string, password: string) {
    try {
      const response = await this.api.post('/auth/login', {
        email: identifier,
        password,
      });
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleError(error, 'login');
      return null;
    }
  }

  async updateOnboarding(
    token: string,
    data: { step: number; name?: string; investorProfile?: string }
  ) {
    try {
      const response = await this.api.patch('/users/onboarding/step', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (error: any) {
      this.handleError(error, 'updateOnboarding');
      throw new Error('Falha ao atualizar perfil.');
    }
  }

  // --- CONTAS & TRANSAÇÕES ---

  async createAccount(
    token: string,
    data: { name: string; type: string; balance: number; currency?: string }
  ) {
    try {
      const response = await this.api.post(
        '/accounts',
        {
          ...data,
          currency: data.currency || 'BRL',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data;
    } catch (error: any) {
      this.handleError(error, 'createAccount');
      throw new Error('Falha ao criar conta.');
    }
  }

  async createTransaction(token: string, description: string, amount: number) {
    try {
      const accountId = await this.getFirstAccountId(token);

      const response = await this.api.post(
        '/transactions',
        {
          description,
          amount,
          date: new Date(),
          type: 'EXPENSE',
          isPaid: true,
          accountId: accountId,
          categoryId: null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleError(error, 'createTransaction');
      throw new Error(error.response?.data?.message || 'Falha ao criar transação');
    }
  }

  async getDashboardSummary(token: string) {
    try {
      const response = await this.api.get('/reports/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleError(error, 'getDashboardSummary');
      throw new Error('Não foi possível buscar o saldo.');
    }
  }

  async getLastTransactions(token: string, limit: number = 5) {
    try {
      const response = await this.api.get('/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactions = Array.isArray(response.data) ? response.data : response.data.data || [];
      return transactions.slice(0, limit);
    } catch (error: any) {
      this.handleError(error, 'getLastTransactions');
      throw new Error('Não foi possível buscar o extrato.');
    }
  }

  // --- RELATÓRIOS & INSIGHTS (Novos Métodos) ---

  async getInsights(token: string) {
    try {
      const response = await this.api.get('/reports/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleError(error, 'getInsights');
      throw new Error('Não foi possível buscar insights.');
    }
  }

  async getExpensesByCategory(token: string) {
    try {
      // Por padrão, o backend usa o mês atual se não passar datas
      const response = await this.api.get('/reports/expenses-by-category', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      this.handleError(error, 'getExpensesByCategory');
      throw new Error('Não foi possível buscar o relatório de categorias.');
    }
  }

  async downloadReport(token: string, type: 'PDF' | 'EXCEL') {
    try {
      const response = await this.api.get('/reports/export', {
        headers: { Authorization: `Bearer ${token}` },
        params: { type }, // Por padrão o backend usa o mês atual se não enviar datas
        responseType: 'arraybuffer', // Crucial para tratar arquivos binários
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error, 'downloadReport');
      throw new Error('Falha ao baixar o relatório.');
    }
  }

  // --- HELPERS PRIVADOS ---

  private async getFirstAccountId(token: string): Promise<string> {
    try {
      const response = await this.api.get('/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accounts = Array.isArray(response.data) ? response.data : response.data.data || [];

      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada.');
      }
      return accounts[0].id;
    } catch (error: any) {
      this.handleError(error, 'getFirstAccountId');
      throw error;
    }
  }

  private handleError(error: any, context: string) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`❌ [Bot] ${context}: Backend inacessível ou offline em ${BASE_URL}`);
    } else if (error.code === 'ECONNABORTED') {
      console.error(`❌ [Bot] ${context}: Timeout! O Backend demorou mais de 30s para responder.`);
    } else {
      console.error(`❌ [Bot] ${context}:`, error.response?.data || error.message);
    }
  }
}
