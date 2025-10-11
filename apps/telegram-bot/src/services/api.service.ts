import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface UserSession {
  userId: string;
  accessToken: string;
  email: string;
  name: string;
}

export class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Auth
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(email: string, password: string): Promise<UserSession> {
    const response = await this.client.post('/auth/login', { email, password });
    return {
      userId: response.data.user.id,
      accessToken: response.data.accessToken,
      email: response.data.user.email,
      name: response.data.user.name,
    };
  }

  // Accounts
  async getAccounts(token: string) {
    const response = await this.client.get('/accounts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async createAccount(
    token: string,
    data: { name: string; type: string; initialBalance: number }
  ) {
    const response = await this.client.post('/accounts', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async updateAccount(
    token: string,
    accountId: string,
    data: { name?: string; type?: string }
  ) {
    const response = await this.client.patch(`/accounts/${accountId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async deleteAccount(token: string, accountId: string) {
    const response = await this.client.delete(`/accounts/${accountId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // Categories
  async getCategories(token: string) {
    const response = await this.client.get('/categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getSubcategories(token: string, categoryId: string) {
    const response = await this.client.get(`/categories/${categoryId}/subcategories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // Transactions
  async createTransaction(
    token: string,
    data: {
      accountId: string;
      categoryId: string;
      subcategoryId?: string;
      movementType: 'income' | 'expense' | 'investment' | 'transfer';
      amount: number;
      description: string;
      transactionDate?: string;
    }
  ) {
    const response = await this.client.post('/transactions', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getTransactions(token: string, params?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/transactions', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  }

  // Dashboard
  async getBalance(token: string) {
    const response = await this.client.get('/dashboard/balance', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getSummaryCards(token: string) {
    const response = await this.client.get('/dashboard/summary-cards', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getSpendingByCategory(token: string) {
    const response = await this.client.get('/dashboard/spending-by-category', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // Reports
  async getMonthlyReport(token: string, year: number, month: number) {
    const response = await this.client.get('/reports/monthly', {
      headers: { Authorization: `Bearer ${token}` },
      params: { year, month },
    });
    return response.data;
  }

  // AI
  async suggestCategory(token: string, description: string) {
    const response = await this.client.post(
      '/ai/suggest-category',
      { description },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
}

export const apiService = new ApiService();
