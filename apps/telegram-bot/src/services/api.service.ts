import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

// Força IPv4 (127.0.0.1) para evitar problemas de DNS em localhost
const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3333/api';

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 5000,
    });
  }

  // Verifica existência do usuário
  async checkUser(identifier: string): Promise<boolean> {
    try {
      console.log(`📡 [Bot] Consultando usuário: "${identifier}" em ${BASE_URL}/auth/check...`);
      const response = await this.api.post('/auth/check', { identifier });
      console.log(`✅ [Bot] Resposta da API:`, JSON.stringify(response.data, null, 2));
      
      // CORREÇÃO: Acessa response.data.data.exists devido ao Interceptor do NestJS
      const payload = response.data;
      if (payload.data && typeof payload.data.exists === 'boolean') {
        return payload.data.exists;
      }
      return !!payload.exists;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.error(`❌ [Bot] Erro de Conexão: O Backend está offline ou inacessível em ${BASE_URL}`);
        throw new Error('Backend offline');
      }
      console.error('❌ [Bot] Erro na API:', error.response?.data || error.message);
      throw error; 
    }
  }

  // Autentica
  async login(identifier: string, password: string) {
    try {
      const response = await this.api.post('/auth/login', { 
        email: identifier, 
        password 
      });
      // CORREÇÃO: Desembrulha a resposta do interceptor para retornar { access_token, user }
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('❌ [Bot] Erro no login:', error.response?.data || error.message);
      return null;
    }
  }

  // Cria transação
  async createTransaction(token: string, description: string, amount: number) {
    try {
      const response = await this.api.post(
        '/transactions',
        {
          description,
          amount,
          date: new Date(),
          type: 'EXPENSE',
          isPaid: true,
          accountId: await this.getFirstAccountId(token),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Erro ao criar transação:', error.message);
      throw new Error(error.response?.data?.message || 'Falha ao criar transação');
    }
  }

  // Busca Resumo Financeiro
  async getDashboardSummary(token: string) {
    try {
      const response = await this.api.get('/reports/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Erro ao buscar resumo:', error.message);
      throw new Error('Não foi possível buscar o saldo.');
    }
  }

  // Busca últimas transações
  async getLastTransactions(token: string, limit: number = 5) {
    try {
      const response = await this.api.get('/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const transactions = Array.isArray(response.data) ? response.data : response.data.data;
      return transactions.slice(0, limit);
    } catch (error: any) {
      console.error('Erro ao buscar extrato:', error.message);
      throw new Error('Não foi possível buscar o extrato.');
    }
  }

  private async getFirstAccountId(token: string): Promise<string> {
    try {
      const response = await this.api.get('/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accounts = Array.isArray(response.data) ? response.data : response.data.data;
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada.');
      }
      return accounts[0].id;
    } catch (error: any) {
        console.error('Erro contas:', error.message);
        throw error;
    }
  }
}