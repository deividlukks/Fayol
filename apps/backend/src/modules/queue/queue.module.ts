import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiQueueProcessor } from './processors/ai-queue.processor';
import { NotificationsQueueProcessor } from './processors/notifications-queue.processor';
import { EmailQueueProcessor } from './processors/email-queue.processor';
import { QueueService } from './queue.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { QUEUES } from './queue.constants';

/**
 * Nomes das filas
 */
export { QUEUES };

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: QUEUES.AI_CATEGORIZATION },
      { name: QUEUES.AI_INSIGHTS },
      { name: QUEUES.AI_FORECAST },
      { name: QUEUES.NOTIFICATIONS },
      { name: QUEUES.REPORTS },
      { name: QUEUES.EMAIL }
    ),
    PrismaModule,
    EmailModule,
  ],
  providers: [AiQueueProcessor, NotificationsQueueProcessor, EmailQueueProcessor, QueueService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
