import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsService } from './services/integrations.service';
import { MarketDataService } from './services/market-data.service';
import { IntegrationsController } from './controllers/integrations.controller';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    // Configuração do Cache com Redis
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST') || 'localhost',
        port: configService.get('REDIS_PORT') || 6379,
        ttl: 3600,
      }),
    }),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, MarketDataService],
  exports: [IntegrationsService, MarketDataService],
})
export class IntegrationsModule {}