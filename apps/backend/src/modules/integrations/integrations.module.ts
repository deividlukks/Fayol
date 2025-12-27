import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsService } from './services/integrations.service';
import { MarketDataService } from './services/market-data.service';
import { PluggyService } from './services/pluggy.service';
import { StripeService } from './services/stripe.service';
import { AlphaVantageService } from './services/alpha-vantage.service';
import { IntegrationsController } from './controllers/integrations.controller';
import { PluggyController } from './controllers/pluggy.controller';
import { StripeController } from './controllers/stripe.controller';
import { MarketDataController } from './controllers/market-data.controller';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
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
  controllers: [
    IntegrationsController,
    PluggyController,
    StripeController,
    MarketDataController,
  ],
  providers: [
    IntegrationsService,
    MarketDataService,
    PluggyService,
    StripeService,
    AlphaVantageService,
  ],
  exports: [
    IntegrationsService,
    MarketDataService,
    PluggyService,
    StripeService,
    AlphaVantageService,
  ],
})
export class IntegrationsModule {}
