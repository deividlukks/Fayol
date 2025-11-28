import { Injectable } from '@nestjs/common';

@Injectable()
export class IntegrationsService {
  // Serviço preparado para receber lógica de Pluggy/Belvo na Fase 6
  
  async syncBankAccount(connectionId: string) {
    console.log(`[TODO] Sincronizar conta bancária ${connectionId}`);
    return { status: 'pending', message: 'Integração em desenvolvimento' };
  }
  
  async getMarketData(ticker: string) {
    // Placeholder para Alpha Vantage/Yahoo Finance
    return { ticker, price: 0, lastUpdate: new Date() };
  }
}