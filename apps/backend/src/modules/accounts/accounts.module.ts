import { Module } from '@nestjs/common';
import { AccountsService } from './services/accounts.service'; // Ajustado
import { AccountsController } from './controllers/accounts.controller'; // Ajustado

@Module({
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}