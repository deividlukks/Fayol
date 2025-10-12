import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import {
  SpendingSummary,
  CategorySpending,
} from './dto/analyze-spending.dto';
import { firstValueFrom } from 'rxjs';

// Interface para a estrutura da transação que o serviço de IA espera
interface AiTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  movementType: 'income' | 'expense';
  category?: string;
  subcategory?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly aiServiceBaseUrl = 'http://ai-service:8000';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Sugere uma categoria para uma transação com base na sua descrição.
   * Chama o serviço de IA externo.
   */
  async suggestCategory(
    description: string,
  ): Promise<{ category: string; subcategory: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.aiServiceBaseUrl}/suggest-category`,
          { description },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Falha ao chamar o AI Service para sugerir categoria: ${error.message}`,
      );
      // Fallback: retorna uma categoria padrão em caso de erro
      return { category: 'Outros', subcategory: 'Não categorizado' };
    }
  }

  /**
   * Analisa os gastos de um usuário e retorna um resumo.
   * A lógica de cálculo permanece no backend, mas poderia ser movida para a IA no futuro.
   */
  async analyzeSpending(
    userId: string,
    transactions: AiTransaction[],
  ): Promise<any> {
    // A lógica principal permanece aqui, pois é um cálculo direto.
    // O serviço de IA poderia ser usado para obter "insights" mais profundos no futuro.
    const totalIncome = transactions
      .filter((t) => t.movementType === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions
      .filter((t) => t.movementType === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
    const transactionCount = transactions.length;
    const averageTransaction =
      transactionCount > 0 ? (totalIncome + totalExpenses) / transactionCount : 0;

    const summary = {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate: `${savingsRate.toFixed(2)}%`,
      transactionCount,
      averageTransaction,
    };

    const categorySpending = await this.getSpendingByCategory(transactions);
    const spendingHistory = transactions.map((t) => ({
      date: t.date.toISOString().split('T')[0],
      amount: t.amount,
      type: t.movementType,
    }));

    return {
      userId,
      generatedAt: new Date(),
      summary,
      categorySpending,
      spendingHistory,
    };
  }

  /**
   * Retorna os gastos por categoria.
   */
  async getSpendingByCategory(
    transactions: AiTransaction[],
  ): Promise<CategorySpending[]> {
    const spendingMap = new Map<string, number>();

    const expenseTransactions = transactions.filter(
      (t) => t.movementType === 'expense',
    );

    expenseTransactions.forEach((t) => {
      const category = t.category || 'Não categorizado';
      const currentAmount = spendingMap.get(category) || 0;
      spendingMap.set(category, currentAmount + t.amount);
    });

    // Calcula o total de despesas para percentagens
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    return Array.from(spendingMap.entries()).map(([category, total]) => ({
      category,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
    }));
  }

  /**
   * Detecta anomalias nas transações do usuário.
   */
  async detectAnomalies(
    userId: string,
    transactions: AiTransaction[],
  ): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceBaseUrl}/detect-anomalies`, {
          transactions: transactions.map((t) => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            movementType: t.movementType,
            category: t.category,
            subcategory: t.subcategory,
          })),
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Falha ao chamar o AI Service para detectar anomalias: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Obtém a saúde financeira geral do usuário a partir do serviço de IA.
   */
  async getFinancialHealth(userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceBaseUrl}/financial-health`, {
          userId, // Pode enviar transações ou apenas o ID do usuário
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Falha ao chamar o AI Service para saúde financeira: ${error.message}`,
      );
      return { healthScore: 0, message: 'Serviço de análise indisponível.' };
    }
  }
}
