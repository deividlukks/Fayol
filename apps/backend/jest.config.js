module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.enum.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@fayol/database-models$': '<rootDir>/../../packages/database-models/src',
    '^@fayol/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@fayol/shared-constants$': '<rootDir>/../../packages/shared-constants/src',
    '^@fayol/shared-utils$': '<rootDir>/../../packages/shared-utils/src',
    '^@fayol/validation-schemas$': '<rootDir>/../../packages/validation-schemas/src',
  },
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
};
