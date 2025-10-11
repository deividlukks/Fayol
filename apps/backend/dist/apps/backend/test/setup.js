jest.setTimeout(30000);
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL =
    process.env.DATABASE_URL_TEST || 'postgresql://fayol:fayol_test@localhost:5432/fayol_test';
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
//# sourceMappingURL=setup.js.map