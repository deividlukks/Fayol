import { IOpenBankingProvider, BankConnection, BankTransaction } from './open-banking.interface';

export class BelvoProvider implements IOpenBankingProvider {
  private readonly apiUrl: string;
  private readonly secretId: string;
  private readonly secretPassword: string;

  constructor(apiUrl: string, secretId: string, secretPassword: string) {
    this.apiUrl = apiUrl;
    this.secretId = secretId;
    this.secretPassword = secretPassword;
  }

  /**
   * Gera o token/widget para o frontend iniciar a conexão
   */
  async createConnectionWidget(): Promise<{ url: string }> {
    // Simulação da chamada de API para gerar access token do widget
    // Na implementação real: POST /api/token/
    console.log(`[Belvo] Generating widget token for ID: ${this.secretId}`);
    
    return {
      url: `https://widget.belvo.com/?access_token=mock_belvo_token_${Date.now()}`
    };
  }

  /**
   * Busca transações de uma conta específica
   */
  async syncTransactions(connectionId: string, fromDate: Date): Promise<BankTransaction[]> {
    console.log(`[Belvo] Syncing transactions for link ${connectionId} from ${fromDate.toISOString()}`);
    
    // Mock de resposta da API Belvo
    return [
      {
        externalId: `belvo_tx_${Date.now()}_1`,
        date: new Date(),
        amount: -150.00,
        description: 'MERCADO BELVO',
        category: 'Groceries'
      },
      {
        externalId: `belvo_tx_${Date.now()}_2`,
        date: new Date(),
        amount: -29.90,
        description: 'NETFLIX',
        category: 'Subscription'
      }
    ];
  }

  /**
   * Lista as conexões (Links) ativos
   */
  async getConnections(userId: string): Promise<BankConnection[]> {
    console.log(`[Belvo] Fetching links for user ${userId}`);

    // Mock de resposta
    return [
      {
        id: 'link_belvo_uuid_123',
        institutionName: 'Banco Itaú (Via Belvo)',
        status: 'CONNECTED',
        lastSync: new Date()
      }
    ];
  }
}