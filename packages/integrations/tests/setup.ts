// Setup for integrations tests
global.fetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});
