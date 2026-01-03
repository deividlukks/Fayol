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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    // Configuração do Cache com Redis usando Keyv (cache-manager v7+)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST') || 'localhost';
        const redisPort = configService.get('REDIS_PORT') || 6379;
        const redisPassword = configService.get('REDIS_PASSWORD');

        // Construir connection string do Redis
        const redisUrl = redisPassword
          ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
          : `redis://${redisHost}:${redisPort}`;

        return {
          stores: [
            new Keyv({
              store: new KeyvRedis(redisUrl),
              ttl: 3600000, // 1 hora em milissegundos (cache-manager v7 usa ms)
            }),
          ],
        };
      },
    }),
  ],
  controllers: [IntegrationsController, PluggyController, StripeController, MarketDataController],
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
