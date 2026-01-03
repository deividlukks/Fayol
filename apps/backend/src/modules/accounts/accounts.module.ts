import { Module } from '@nestjs/common';
import { AccountsService } from './services/accounts.service'; // Ajustado
import { AccountsController } from './controllers/accounts.controller'; // Ajustado
import { CurrencyService } from './services/currency.service';

@Module({
  controllers: [AccountsController],
  providers: [AccountsService, CurrencyService],
  exports: [AccountsService, CurrencyService],
})
export class AccountsModule {}
