import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TradingController } from './controllers/trading.controller';
import { TradingService } from './services/trading.service';
import { MarketDataService } from './services/market-data.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ConfigModule, // Necessário para o MarketDataService ler a API KEY
    HttpModule, // Necessário para o MarketDataService fazer requisições HTTP
  ],
  controllers: [TradingController],
  providers: [TradingService, MarketDataService],
  exports: [TradingService], // Exportamos caso outro módulo precise consultar carteira
})
export class TradingModule {}
