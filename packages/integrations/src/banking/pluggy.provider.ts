import { IOpenBankingProvider, BankConnection, BankTransaction } from './open-banking.interface';

export class PluggyProvider implements IOpenBankingProvider {
  async createConnectionWidget(): Promise<{ url: string }> {
    // TODO: Implementar chamada real à API da Pluggy
    return { url: 'https://connect.pluggy.ai/demo-widget' };
  }

  async syncTransactions(connectionId: string, fromDate: Date): Promise<BankTransaction[]> {
    console.log(`[Pluggy] Sincronizando conexão ${connectionId} desde ${fromDate.toISOString()}`);
    // Mock de retorno
    return [];
  }

  async getConnections(userId: string): Promise<BankConnection[]> {
    console.log(`[Pluggy] Buscando conexões para user ${userId}`);
    return [];
  }
}
