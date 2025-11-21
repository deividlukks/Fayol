import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}