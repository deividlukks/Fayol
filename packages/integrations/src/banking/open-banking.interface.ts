export interface BankConnection {
  id: string;
  institutionName: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSync: Date;
}

export interface BankTransaction {
  externalId: string;
  date: Date;
  amount: number;
  description: string;
  category?: string;
}

export interface IOpenBankingProvider {
  createConnectionWidget(): Promise<{ url: string }>;
  syncTransactions(connectionId: string, fromDate: Date): Promise<BankTransaction[]>;
  getConnections(userId: string): Promise<BankConnection[]>;
}
