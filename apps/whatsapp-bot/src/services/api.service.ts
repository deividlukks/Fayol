import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config/app.config';
import { logger } from '../utils/logger';
import { UserTier } from '../types/user.types';

/**
 * Serviço de comunicação com a API Backend do Fayol
 * 
 * Endpoints utilizados:
 * - POST /auth/login - Autenticação
 * - GET /users/me - Dados do usuário
 * - POST /transactions - Criar transação
 * - GET /transactions - Listar transações
 * - GET /accounts - Listar contas
 * - GET /categories - Listar categorias
 * - POST /ai/suggest-category - Sugestão de categoria por IA
 * - GET /dashboard/summary-cards - Resumo financeiro
 * - GET /reports/monthly - Relatório mensal
 */
export class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token automaticamente
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para log de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Trata erros da API
   */
  private handleApiError(error: AxiosError): void {
    if (error.response) {
      logger.error(`[API] Erro ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      logger.error('[API] Sem resposta do servidor:', error.message);
    } else {
      logger.error('[API] Erro ao fazer requisição:', error.message);
    }
  }

  /**
   * Define o token de autenticação
   */
  setToken(token: string): void {
    this.token = token;
    logger.debug('[API] Token de autenticação definido');
  }

  /**
   * Remove o token de autenticação
   */
  clearToken(): void {
    this.token = null;
    logger.debug('[API] Token de autenticação removido');
  }

  // ===========================================
  // AUTENTICAÇÃO
  // ===========================================

  /**
   * Autentica usuário com login e senha
   */
  async login(login: string, password: string): Promise<{
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string;
    };
  }> {
    try {
      const response = await this.client.post('/auth/login', {
        login,
        password,
      });

      this.setToken(response.data.accessToken);
      logger.info(`[API] ✅ Login realizado com sucesso: ${response.data.user.name}`);

      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao fazer login:', error);
      throw new Error('Falha ao autenticar. Verifique suas credenciais.');
    }
  }

  /**
   * Obtém dados do usuário logado
   */
  async getCurrentUser(): Promise<{
    id: string;
    name: string;
    email: string;
    phone: string;
    tier?: UserTier; // Assumindo que o backend retorna o tier
  }> {
    try {
      const response = await this.client.get('/users/me');
      logger.debug('[API] Dados do usuário obtidos');
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao buscar dados do usuário:', error);
      throw new Error('Falha ao buscar dados do usuário');
    }
  }

  // ===========================================
  // TRANSAÇÕES
  // ===========================================

  /**
   * Cria uma nova transação
   */
  async createTransaction(data: {
    accountId: string;
    movementType: 'income' | 'expense';
    launchType: 'income' | 'expense' | 'investment' | 'transfer';
    categoryId: string;
    subcategoryId?: string;
    amount: number;
    description?: string;
    dueDate?: Date;
    receiptDate?: Date;
    isRecurring?: boolean;
    recurrencePeriod?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/transactions', data);
      logger.info(`[API] ✅ Transação criada: ${response.data.code}`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao criar transação:', error);
      throw new Error('Falha ao criar transação');
    }
  }

  /**
   * Lista transações do usuário
   */
  async getTransactions(filters?: {
    limit?: number;
    status?: 'pending' | 'effectuated';
    accountId?: string;
    categoryId?: string;
  }): Promise<any[]> {
    try {
      const response = await this.client.get('/transactions', { params: filters });
      logger.debug(`[API] ${response.data.length} transações obtidas`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao listar transações:', error);
      throw new Error('Falha ao buscar transações');
    }
  }

  // ===========================================
  // CONTAS
  // ===========================================

  /**
   * Lista contas do usuário
   */
  async getAccounts(): Promise<any[]> {
    try {
      const response = await this.client.get('/accounts');
      logger.debug(`[API] ${response.data.length} contas obtidas`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao listar contas:', error);
      throw new Error('Falha ao buscar contas');
    }
  }

  // ===========================================
  // CATEGORIAS
  // ===========================================

  /**
   * Lista categorias disponíveis
   */
  async getCategories(): Promise<any[]> {
    try {
      const response = await this.client.get('/categories');
      logger.debug(`[API] ${response.data.length} categorias obtidas`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao listar categorias:', error);
      throw new Error('Falha ao buscar categorias');
    }
  }

  /**
   * Lista subcategorias de uma categoria
   */
  async getSubcategories(categoryId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/categories/${categoryId}/subcategories`);
      logger.debug(`[API] ${response.data.length} subcategorias obtidas`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao listar subcategorias:', error);
      throw new Error('Falha ao buscar subcategorias');
    }
  }

  // ===========================================
  // IA
  // ===========================================

  /**
   * Sugere categoria baseada na descrição
   */
  async suggestCategory(description: string): Promise<{
    category: string;
    subcategory?: string;
    confidence: number;
  }> {
    try {
      const response = await this.client.post('/ai/suggest-category', { description });
      logger.debug(`[API] Categoria sugerida: ${response.data.category}`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao sugerir categoria:', error);
      throw new Error('Falha ao sugerir categoria');
    }
  }

  // ===========================================
  // DASHBOARD
  // ===========================================

  /**
   * Obtém saldo total
   */
  async getBalance(): Promise<{
    total: number;
    accounts: Array<{ name: string; balance: number }>;
  }> {
    try {
      const response = await this.client.get('/dashboard/balance');
      logger.debug(`[API] Saldo obtido: ${response.data.total}`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao obter saldo:', error);
      throw new Error('Falha ao buscar saldo');
    }
  }

  /**
   * Obtém resumo do mês
   */
  async getSummaryCards(): Promise<{
    currentMonth: {
      income: number;
      expense: number;
      balance: number;
    };
    lastMonth: {
      income: number;
      expense: number;
      balance: number;
    };
  }> {
    try {
      const response = await this.client.get('/dashboard/summary-cards');
      logger.debug('[API] Resumo do mês obtido');
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao obter resumo:', error);
      throw new Error('Falha ao buscar resumo');
    }
  }

  /**
   * Obtém últimas transações
   */
  async getLatestTransactions(limit: number = 10): Promise<any[]> {
    try {
      const response = await this.client.get('/dashboard/latest-transactions', {
        params: { limit },
      });
      logger.debug(`[API] ${response.data.length} últimas transações obtidas`);
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao obter últimas transações:', error);
      throw new Error('Falha ao buscar últimas transações');
    }
  }

  /**
   * Obtém gastos por categoria
   */
  async getSpendingByCategory(): Promise<
    Array<{
      category: string;
      amount: number;
      percentage: number;
    }>
  > {
    try {
      const response = await this.client.get('/dashboard/spending-by-category');
      logger.debug('[API] Gastos por categoria obtidos');
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao obter gastos por categoria:', error);
      throw new Error('Falha ao buscar gastos por categoria');
    }
  }

  // ===========================================
  // RELATÓRIOS
  // ===========================================

  /**
   * Obtém resumo diário
   */
  async getDailySummary(date?: string): Promise<any> {
    try {
      const response = await this.client.get('/reports/daily-summary', {
        params: { date },
      });
      logger.debug('[API] Resumo diário obtido');
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao obter resumo diário:', error);
      throw new Error('Falha ao buscar resumo diário');
    }
  }

  /**
   * Obtém relatório mensal
   */
  async getMonthlyReport(month?: string): Promise<any> {
    try {
      const response = await this.client.get('/reports/monthly-full', {
        params: { month },
      });
      logger.debug('[API] Relatório mensal obtido');
      return response.data;
    } catch (error) {
      logger.error('[API] ❌ Erro ao obter relatório mensal:', error);
      throw new Error('Falha ao buscar relatório mensal');
    }
  }
}
