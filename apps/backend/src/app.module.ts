import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AppController } from './app.controller';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BudgetsModule } from './modules/budgets/budgets.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TradingModule } from './modules/trading/trading.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { GoalsModule } from './modules/goals/goals.module';
import { AuditModule } from './modules/audit/audit.module';
import { QueueModule } from './modules/queue/queue.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { ConsentModule } from './consent/consent.module';
import { DataExportModule } from './data-export/data-export.module';
import { LoggingInterceptor } from './telemetry/logging.interceptor';
import { SentryInterceptor } from './telemetry/sentry.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '../../.env'),
    }),
    // Configuração do Throttler (Rate Limiting)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minuto
        limit: 10, // Máximo de 10 requisições por IP por minuto (padrão)
      },
      {
        name: 'forgot-password',
        ttl: 900000, // 15 minutos
        limit: 3, // Máximo de 3 tentativas de reset por email/IP
      },
    ]),
    ScheduleModule.forRoot(),
    CommonModule, // Módulo global com serviços comuns
    PrismaModule,
    TelemetryModule, // Observabilidade: Tracing, Metrics, Logging
    MonitoringModule,
    HealthModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    AccountsModule,
    TransactionsModule,
    BudgetsModule,
    InvestmentsModule,
    ReportsModule,
    TradingModule,
    AiModule,
    NotificationsModule,
    IntegrationsModule,
    GoalsModule,
    AuditModule,
    QueueModule,
    WebsocketModule,
    ConsentModule, // LGPD: Consent Management
    DataExportModule, // LGPD: Data Portability
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Aplica proteção globalmente
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor, // Error tracking com Sentry (primeiro)
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor, // Logging estruturado global (segundo)
    },
  ],
})
export class AppModule {}
