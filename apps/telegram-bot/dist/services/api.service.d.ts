export interface UserSession {
    userId: string;
    accessToken: string;
    email: string;
    name: string;
}
export declare class ApiService {
    private client;
    constructor();
    register(data: {
        name: string;
        email: string;
        phone: string;
        password: string;
    }): Promise<any>;
    login(email: string, password: string): Promise<UserSession>;
    getAccounts(token: string): Promise<any>;
    createAccount(token: string, data: {
        name: string;
        type: string;
        initialBalance: number;
    }): Promise<any>;
    updateAccount(token: string, accountId: string, data: {
        name?: string;
        type?: string;
    }): Promise<any>;
    deleteAccount(token: string, accountId: string): Promise<any>;
    getCategories(token: string): Promise<any>;
    getSubcategories(token: string, categoryId: string): Promise<any>;
    createTransaction(token: string, data: {
        accountId: string;
        categoryId: string;
        subcategoryId?: string;
        movementType: 'income' | 'expense' | 'investment' | 'transfer';
        amount: number;
        description: string;
        transactionDate?: string;
    }): Promise<any>;
    getTransactions(token: string, params?: {
        limit?: number;
        offset?: number;
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    getBalance(token: string): Promise<any>;
    getSummaryCards(token: string): Promise<any>;
    getSpendingByCategory(token: string): Promise<any>;
    getMonthlyReport(token: string, year: number, month: number): Promise<any>;
    suggestCategory(token: string, description: string): Promise<any>;
}
export declare const apiService: ApiService;
//# sourceMappingURL=api.service.d.ts.map