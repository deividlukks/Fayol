import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Modules
import { PrismaModule } from './prisma/prisma.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { AiModule } from './ai/ai.module';
import { ExportModule } from './export/export.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ChartsModule } from './charts/charts.module';
import { NotificationsModule } from './notifications/notifications.module';

// Interceptors
import { HttpLoggingInterceptor } from './common/interceptors/http-logging.interceptor';

// Middleware
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    // Configuração
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),

    // Módulos Core
    PrismaModule,
    LoggerModule,

    // Módulos de Negócio
    AuthModule,
    AdminModule,
    UsersModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    RecurringTransactionsModule,
    DashboardModule,
    ReportsModule,
    AiModule,
    ExportModule,
    BudgetsModule,
    ChartsModule,
    NotificationsModule,
  ],
  providers: [
    // Interceptor global de logging
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
