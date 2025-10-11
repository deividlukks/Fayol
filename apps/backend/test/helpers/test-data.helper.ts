import { PrismaClient } from '@prisma/client';

/**
 * Helper para limpar o banco de dados de teste
 * CUIDADO: Apaga todos os dados!
 */
export async function cleanDatabase(prisma: PrismaClient) {
  // A ordem é importante por causa das foreign keys
  await prisma.transaction.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Helper para esperar um tempo (útil para testes assíncronos)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper para gerar email de teste único
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Helper para gerar telefone de teste único
 */
export function generateTestPhone(): string {
  const random = Math.floor(Math.random() * 900000000) + 100000000;
  return `+5534${random}`;
}

/**
 * Helper para criar dados de usuário de teste
 */
export function createTestUserData(
  overrides?: Partial<{
    name: string;
    email: string;
    phone: string;
    password: string;
  }>,
) {
  return {
    name: overrides?.name || 'Test User',
    email: overrides?.email || generateTestEmail(),
    phone: overrides?.phone || generateTestPhone(),
    password: overrides?.password || 'Test@123456',
  };
}

/**
 * Helper para criar dados de conta de teste
 */
export function createTestAccountData(
  overrides?: Partial<{
    name: string;
    type: string;
    initialBalance: number;
  }>,
) {
  return {
    name: overrides?.name || 'Conta Teste',
    type: overrides?.type || 'checking',
    initialBalance: overrides?.initialBalance || 1000,
  };
}

/**
 * Helper para criar dados de categoria de teste
 */
export function createTestCategoryData(
  overrides?: Partial<{
    name: string;
    type: string;
  }>,
) {
  return {
    name: overrides?.name || 'Categoria Teste',
    type: overrides?.type || 'expense',
  };
}

/**
 * Helper para criar dados de transação de teste
 */
export function createTestTransactionData(
  accountId: string,
  categoryId: string,
  overrides?: Partial<{
    movementType: string;
    launchType: string;
    amount: number;
    description: string;
    dueDate: Date;
    isRecurring: boolean;
  }>,
) {
  return {
    accountId,
    categoryId,
    movementType: overrides?.movementType || 'expense',
    launchType: overrides?.launchType || 'expense',
    amount: overrides?.amount || 100,
    description: overrides?.description || 'Transação de teste',
    dueDate: overrides?.dueDate || new Date(),
    isRecurring: overrides?.isRecurring || false,
  };
}
