import { Module } from '@nestjs/common';
import { InvestmentsService } from './services/investments.service';
import { InvestmentsController } from './controllers/investments.controller';
import { ProfitabilityService } from './services/profitability.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [IntegrationsModule, AccountsModule],
  controllers: [InvestmentsController],
  providers: [InvestmentsService, ProfitabilityService],
  exports: [InvestmentsService, ProfitabilityService],
})
export class InvestmentsModule {}
