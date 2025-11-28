import { Module } from '@nestjs/common';
import { IntegrationsService } from './services/integrations.service';

@Module({
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}