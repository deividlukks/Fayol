import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../queue.constants';
import { AiCategorizationJob, AiInsightsJob, AiForecastJob } from '../queue.service';
import { PrismaService } from '../../../prisma/prisma.service';
import axios from 'axios';

@Processor(QUEUES.AI_CATEGORIZATION, {
  concurrency: 5, // Processa até 5 jobs simultaneamente
})
export class AiQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(AiQueueProcessor.name);
  private readonly aiServiceUrl: string;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async process(job: Job<AiCategorizationJob | AiInsightsJob | AiForecastJob>) {
    this.logger.debug(`Processando job ${job.name} (ID: ${job.id})`);

    try {
      switch (job.name) {
        case 'categorize':
          return await this.processCategorization(job as Job<AiCategorizationJob>);
        case 'generate-insights':
          return await this.processInsights(job as Job<AiInsightsJob>);
        case 'forecast':
          return await this.processForecast(job as Job<AiForecastJob>);
        default:
          this.logger.warn(`Tipo de job desconhecido: ${job.name}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`Erro ao processar job ${job.id}:`, error);
      throw error; // BullMQ vai retentar baseado na configuração
    }
  }

  /**
   * Processa categorização de transação
   */
  private async processCategorization(job: Job<AiCategorizationJob>) {
    const { userId, description, transactionId } = job.data;

    this.logger.debug(`Categorizando: "${description}" para usuário ${userId}`);

    try {
      // Chama serviço Python AI
      const response = await axios.post(`${this.aiServiceUrl}/categorize`, {
        user_id: userId,
        description,
      });

      const categoryName = response.data.category;

      // Busca categoria no banco
      const category = await this.prisma.category.findFirst({
        where: {
          name: categoryName,
          OR: [{ userId }, { isSystemDefault: true }],
        },
      });

      if (!category) {
        this.logger.warn(`Categoria "${categoryName}" não encontrada`);
        return { categoryId: null, categoryName };
      }

      // Se tiver transactionId, atualiza a transação
      if (transactionId) {
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: { categoryId: category.id },
        });

        this.logger.log(`Transação ${transactionId} categorizada como "${categoryName}"`);
      }

      return {
        categoryId: category.id,
        categoryName,
        confidence: response.data.confidence || 0,
      };
    } catch (error) {
      this.logger.error('Erro na categorização:', error);
      throw error;
    }
  }

  /**
   * Processa geração de insights
   */
  private async processInsights(job: Job<AiInsightsJob>) {
    const { userId, startDate, endDate } = job.data;

    this.logger.debug(`Gerando insights para usuário ${userId}`);

    try {
      // Busca transações do período
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 dias padrão
            lte: endDate || new Date(),
          },
        },
        include: {
          category: true,
        },
      });

      // Chama serviço Python AI
      const response = await axios.post(`${this.aiServiceUrl}/insights`, {
        user_id: userId,
        transactions: transactions.map((t) => ({
          amount: Number(t.amount),
          category: t.category?.name || 'Sem categoria',
          date: t.date.toISOString(),
          description: t.description,
          type: t.type,
        })),
      });

      const insights = response.data.insights || [];

      this.logger.log(`${insights.length} insights gerados para usuário ${userId}`);

      return { insights, count: insights.length };
    } catch (error) {
      this.logger.error('Erro na geração de insights:', error);
      throw error;
    }
  }

  /**
   * Processa previsão de gastos
   */
  private async processForecast(job: Job<AiForecastJob>) {
    const { userId, categoryId } = job.data;

    this.logger.debug(`Gerando forecast para usuário ${userId}`);

    try {
      // Busca transações históricas
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
          ...(categoryId && { categoryId }),
          date: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 ano
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      if (transactions.length < 3) {
        this.logger.warn('Dados insuficientes para forecast');
        return { forecast: null, message: 'Dados insuficientes' };
      }

      // Chama serviço Python AI
      const response = await axios.post(`${this.aiServiceUrl}/forecast`, {
        user_id: userId,
        transactions: transactions.map((t) => ({
          amount: Number(t.amount),
          date: t.date.toISOString(),
        })),
      });

      const forecast = response.data;

      this.logger.log(`Forecast gerado para usuário ${userId}`);

      return forecast;
    } catch (error) {
      this.logger.error('Erro na geração de forecast:', error);
      throw error;
    }
  }
}
