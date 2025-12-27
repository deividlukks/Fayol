/**
 * Setup global para testes
 * Configurações e mocks que são aplicados em todos os testes
 */

// Mock de variáveis de ambiente
process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token-123456';
process.env.API_BASE_URL = 'http://localhost:3333/api';

// Mock console methods para testes mais limpos (opcional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Aumenta timeout global se necessário
jest.setTimeout(10000);
