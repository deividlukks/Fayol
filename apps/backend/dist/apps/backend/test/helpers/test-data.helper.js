"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanDatabase = cleanDatabase;
exports.wait = wait;
exports.generateTestEmail = generateTestEmail;
exports.generateTestPhone = generateTestPhone;
exports.createTestUserData = createTestUserData;
exports.createTestAccountData = createTestAccountData;
exports.createTestCategoryData = createTestCategoryData;
exports.createTestTransactionData = createTestTransactionData;
async function cleanDatabase(prisma) {
    await prisma.transaction.deleteMany();
    await prisma.subcategory.deleteMany();
    await prisma.category.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();
}
function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function generateTestEmail() {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}
function generateTestPhone() {
    const random = Math.floor(Math.random() * 900000000) + 100000000;
    return `+5534${random}`;
}
function createTestUserData(overrides) {
    return {
        name: overrides?.name || 'Test User',
        email: overrides?.email || generateTestEmail(),
        phone: overrides?.phone || generateTestPhone(),
        password: overrides?.password || 'Test@123456',
    };
}
function createTestAccountData(overrides) {
    return {
        name: overrides?.name || 'Conta Teste',
        type: overrides?.type || 'checking',
        initialBalance: overrides?.initialBalance || 1000,
    };
}
function createTestCategoryData(overrides) {
    return {
        name: overrides?.name || 'Categoria Teste',
        type: overrides?.type || 'expense',
    };
}
function createTestTransactionData(accountId, categoryId, overrides) {
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
//# sourceMappingURL=test-data.helper.js.map