import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3333/api';

export class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 10000, // Aumentei um pouco o timeout para garantir
    });
  }

  // NOVO: Verifica existência do usuário
  async checkUser(identifier: string): Promise<boolean> {
    try {
      const response = await this.api.post('/auth/check', { identifier });
      return response.data.exists;
    } catch (error: any) {
      console.error('Erro ao verificar usuário:', error.message);
      return false;
    }
  }

  // Autentica
  async login(identifier: string, password: string) {
    try {
      // Enviamos no campo 'email' para satisfazer o DTO padrão, mas pode ser telefone
      const response = await this.api.post('/auth/login', { 
        email: identifier, 
        password 
      });
      return response.data; // { access_token, user, ... }
    } catch (error: any) {
      console.error('Erro no login:', error.response?.data || error.message);
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
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar transação:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Falha ao criar transação');
    }
  }

  // Helper privado
  private async getFirstAccountId(token: string): Promise<string> {
    try {
      const response = await this.api.get('/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Trata caso venha envelopado em 'data' ou direto
      const accounts = Array.isArray(response.data) ? response.data : response.data.data;
      
      if (!accounts || accounts.length === 0) {
        throw new Error('Nenhuma conta encontrada. Crie uma conta no sistema primeiro.');
      }
      
      return accounts[0].id;
    } catch (error: any) {
        console.error('Erro ao buscar contas:', error.message);
        throw error;
    }
  }
}