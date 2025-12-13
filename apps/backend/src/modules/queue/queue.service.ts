import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from './queue.constants';

/**
 * Tipos de jobs para IA
 */
export interface AiCategorizationJob {
  userId: string;
  description: string;
  transactionId?: string;
}

export interface AiInsightsJob {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AiForecastJob {
  userId: string;
  categoryId?: string;
}

export interface NotificationJob {
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUES.AI_CATEGORIZATION)
    private aiCategorizationQueue: Queue<AiCategorizationJob>,
    @InjectQueue(QUEUES.AI_INSIGHTS)
    private aiInsightsQueue: Queue<AiInsightsJob>,
    @InjectQueue(QUEUES.AI_FORECAST)
    private aiForecastQueue: Queue<AiForecastJob>,
    @InjectQueue(QUEUES.NOTIFICATIONS)
    private notificationsQueue: Queue<NotificationJob>,
  ) {}

  /**
   * Adiciona job de categorização de transação
   */
  async addCategorizationJob(data: AiCategorizationJob) {
    try {
      const job = await this.aiCategorizationQueue.add(
        'categorize',
        data,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100, // Mantém últimos 100 jobs completos
          removeOnFail: 500,     // Mantém últimos 500 jobs falhos
        },
      );

      this.logger.debug(`Job de categorização adicionado: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Erro ao adicionar job de categorização', error);
      throw error;
    }
  }

  /**
   * Adiciona job de geração de insights
   */
  async addInsightsJob(data: AiInsightsJob) {
    try {
      const job = await this.aiInsightsQueue.add(
        'generate-insights',
        data,
        {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 50,
          removeOnFail: 200,
        },
      );

      this.logger.debug(`Job de insights adicionado: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Erro ao adicionar job de insights', error);
      throw error;
    }
  }

  /**
   * Adiciona job de previsão de gastos
   */
  async addForecastJob(data: AiForecastJob) {
    try {
      const job = await this.aiForecastQueue.add(
        'forecast',
        data,
        {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 50,
          removeOnFail: 200,
        },
      );

      this.logger.debug(`Job de forecast adicionado: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Erro ao adicionar job de forecast', error);
      throw error;
    }
  }

  /**
   * Adiciona job de notificação
   */
  async addNotificationJob(data: NotificationJob) {
    try {
      const job = await this.notificationsQueue.add(
        'send-notification',
        data,
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 1000,
          removeOnFail: 1000,
        },
      );

      this.logger.debug(`Job de notificação adicionado: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Erro ao adicionar job de notificação', error);
      throw error;
    }
  }

  /**
   * Obtém status de uma fila
   */
  async getQueueStatus(queueName: string) {
    let queue: Queue;

    switch (queueName) {
      case QUEUES.AI_CATEGORIZATION:
        queue = this.aiCategorizationQueue;
        break;
      case QUEUES.AI_INSIGHTS:
        queue = this.aiInsightsQueue;
        break;
      case QUEUES.AI_FORECAST:
        queue = this.aiForecastQueue;
        break;
      case QUEUES.NOTIFICATIONS:
        queue = this.notificationsQueue;
        break;
      default:
        throw new Error(`Fila não encontrada: ${queueName}`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * Limpa jobs completados de uma fila
   */
  async cleanQueue(queueName: string, grace = 0) {
    let queue: Queue;

    switch (queueName) {
      case QUEUES.AI_CATEGORIZATION:
        queue = this.aiCategorizationQueue;
        break;
      case QUEUES.AI_INSIGHTS:
        queue = this.aiInsightsQueue;
        break;
      case QUEUES.AI_FORECAST:
        queue = this.aiForecastQueue;
        break;
      case QUEUES.NOTIFICATIONS:
        queue = this.notificationsQueue;
        break;
      default:
        throw new Error(`Fila não encontrada: ${queueName}`);
    }

    await queue.clean(grace, 100, 'completed');
    await queue.clean(grace, 100, 'failed');

    this.logger.log(`Fila ${queueName} limpa`);
  }
}
