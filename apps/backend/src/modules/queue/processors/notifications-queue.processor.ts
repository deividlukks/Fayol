import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../queue.constants';
import { NotificationJob } from '../queue.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Processor(QUEUES.NOTIFICATIONS, {
  concurrency: 10, // Processa até 10 notificações simultaneamente
})
export class NotificationsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsQueueProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJob>) {
    this.logger.debug(`Processando notificação (ID: ${job.id}) para usuário ${job.data.userId}`);

    try {
      // Cria a notificação no banco de dados
      const notification = await this.prisma.notification.create({
        data: {
          userId: job.data.userId,
          title: job.data.title,
          message: job.data.message,
          type: job.data.type,
          isRead: false,
        },
      });

      this.logger.log(`Notificação ${notification.id} criada para usuário ${job.data.userId}`);

      // TODO: Enviar notificação via WebSocket se o usuário estiver online
      // TODO: Enviar notificação push se o usuário tiver configurado
      // TODO: Enviar email se for uma notificação importante

      return {
        notificationId: notification.id,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error(`Erro ao processar notificação (Job ${job.id}):`, error);
      throw error; // BullMQ vai retentar baseado na configuração
    }
  }
}
