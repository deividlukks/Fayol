// Setup for api-client tests
beforeAll(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  global.localStorage = localStorageMock as any;
});

afterEach(() => {
  jest.clearAllMocks();
});
