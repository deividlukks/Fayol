// Test setup file
process.env.NODE_ENV = 'test';

// Mock environment variables
process.env.WHATSAPP_PROVIDER = 'baileys';
process.env.API_BASE_URL = 'http://localhost:3000/api/v1';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
