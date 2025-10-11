"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_CONSTANTS = void 0;
exports.APP_CONSTANTS = {
    // Limites de paginação
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
    // Formatos de data
    DATE_FORMATS: {
        BR: 'dd/MM/yyyy',
        BR_WITH_TIME: 'dd/MM/yyyy HH:mm',
        ISO: 'yyyy-MM-dd',
    },
    // Valores monetários
    CURRENCY: {
        MIN_VALUE: 0.01,
        MAX_VALUE: 999999999.99,
        DECIMAL_PLACES: 2,
    },
    // Limites de caracteres
    TEXT_LIMITS: {
        NAME: {
            MIN: 3,
            MAX: 100,
        },
        DESCRIPTION: {
            MIN: 0,
            MAX: 500,
        },
        EMAIL: {
            MAX: 255,
        },
        PASSWORD: {
            MIN: 8,
            MAX: 100,
        },
    },
    // Tipos de conta padrão
    DEFAULT_ACCOUNT_TYPES: [
        'CHECKING',
        'SAVINGS',
        'INVESTMENT',
        'CREDIT_CARD',
        'CASH',
        'OTHER',
    ],
    // Tipos de transação
    TRANSACTION_TYPES: ['INCOME', 'EXPENSE'],
    // Perfis de investidor
    INVESTOR_PROFILES: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
    // Tipos de recorrência
    RECURRENCE_TYPES: [
        'NONE',
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'YEARLY',
    ],
    // Mensagens padrão
    MESSAGES: {
        SUCCESS: {
            CREATED: 'Criado com sucesso',
            UPDATED: 'Atualizado com sucesso',
            DELETED: 'Removido com sucesso',
        },
        ERROR: {
            NOT_FOUND: 'Não encontrado',
            UNAUTHORIZED: 'Não autorizado',
            FORBIDDEN: 'Acesso negado',
            VALIDATION: 'Erro de validação',
            INTERNAL: 'Erro interno do servidor',
        },
    },
};
