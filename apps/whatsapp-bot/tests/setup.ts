/**
 * Configuração global de testes
 * Executado antes de todos os testes
 */

// Mock de variáveis de ambiente para testes
process.env.API_BASE_URL = 'http://localhost:3333/api';
process.env.WHATSAPP_PROVIDER = 'baileys';
process.env.WHATSAPP_SESSION_DIR = './test_sessions';
process.env.RATE_LIMIT_MESSAGES_PER_MINUTE = '30';
process.env.ENABLE_GROUP_SUPPORT = 'true';

// Silencia console.log durante testes (opcional)
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Mantém error para debug
  error: console.error,
};

// Cleanup após todos os testes
afterAll(() => {
  // Limpa timers pendentes
  jest.clearAllTimers();
});
