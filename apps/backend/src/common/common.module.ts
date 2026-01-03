import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SoftDeleteService } from './services/soft-delete.service';
import { ComplianceSchedulerService } from './services/compliance-scheduler.service';
import { ComplianceNotificationsService } from './services/compliance-notifications.service';
import { CacheService } from './services/cache.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsentModule } from '../consent/consent.module';
import { DataExportModule } from '../data-export/data-export.module';
import { UsersModule } from '../modules/users/users.module';
import { QueueModule } from '../modules/queue/queue.module';

/**
 * Módulo global que fornece serviços comuns para toda a aplicação
 */
@Global()
@Module({
  imports: [PrismaModule, ConsentModule, DataExportModule, UsersModule, QueueModule],
  providers: [
    // Services
    SoftDeleteService,
    ComplianceSchedulerService,
    ComplianceNotificationsService,
    CacheService,

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
  exports: [SoftDeleteService, ComplianceNotificationsService, CacheService],
})
export class CommonModule {}
