export declare const APP_CONSTANTS: {
    readonly PAGINATION: {
        readonly DEFAULT_PAGE: 1;
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
    };
    readonly DATE_FORMATS: {
        readonly BR: "dd/MM/yyyy";
        readonly BR_WITH_TIME: "dd/MM/yyyy HH:mm";
        readonly ISO: "yyyy-MM-dd";
    };
    readonly CURRENCY: {
        readonly MIN_VALUE: 0.01;
        readonly MAX_VALUE: 999999999.99;
        readonly DECIMAL_PLACES: 2;
    };
    readonly TEXT_LIMITS: {
        readonly NAME: {
            readonly MIN: 3;
            readonly MAX: 100;
        };
        readonly DESCRIPTION: {
            readonly MIN: 0;
            readonly MAX: 500;
        };
        readonly EMAIL: {
            readonly MAX: 255;
        };
        readonly PASSWORD: {
            readonly MIN: 8;
            readonly MAX: 100;
        };
    };
    readonly DEFAULT_ACCOUNT_TYPES: readonly ["CHECKING", "SAVINGS", "INVESTMENT", "CREDIT_CARD", "CASH", "OTHER"];
    readonly TRANSACTION_TYPES: readonly ["INCOME", "EXPENSE"];
    readonly INVESTOR_PROFILES: readonly ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"];
    readonly RECURRENCE_TYPES: readonly ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
    readonly MESSAGES: {
        readonly SUCCESS: {
            readonly CREATED: "Criado com sucesso";
            readonly UPDATED: "Atualizado com sucesso";
            readonly DELETED: "Removido com sucesso";
        };
        readonly ERROR: {
            readonly NOT_FOUND: "Não encontrado";
            readonly UNAUTHORIZED: "Não autorizado";
            readonly FORBIDDEN: "Acesso negado";
            readonly VALIDATION: "Erro de validação";
            readonly INTERNAL: "Erro interno do servidor";
        };
    };
};
