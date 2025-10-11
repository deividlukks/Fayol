import type { AuthResponse, LoginInput, RegisterInput, Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilters, TransactionSummary, Account, CreateAccountInput, UpdateAccountInput, Category, CreateCategoryInput, UpdateCategoryInput, PaginatedResponse, PaginationParams } from '@fayol/shared-types';
export interface FayolApiClientConfig {
    baseURL: string;
    timeout?: number;
    onTokenExpired?: () => void;
}
export declare class FayolApiClient {
    private client;
    private accessToken;
    private onTokenExpired?;
    constructor(config: FayolApiClientConfig);
    login(credentials: LoginInput): Promise<AuthResponse>;
    register(data: RegisterInput): Promise<AuthResponse>;
    refresh(): Promise<AuthResponse>;
    logout(): void;
    setAccessToken(token: string): void;
    getAccessToken(): string | null;
    isAuthenticated(): boolean;
    getTransactions(filters?: TransactionFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Transaction>>;
    getTransaction(id: string): Promise<Transaction>;
    createTransaction(data: CreateTransactionInput): Promise<Transaction>;
    updateTransaction(id: string, data: UpdateTransactionInput): Promise<Transaction>;
    deleteTransaction(id: string): Promise<void>;
    getTransactionSummary(filters?: TransactionFilters): Promise<TransactionSummary>;
    getAccounts(): Promise<Account[]>;
    getAccount(id: string): Promise<Account>;
    createAccount(data: CreateAccountInput): Promise<Account>;
    updateAccount(id: string, data: UpdateAccountInput): Promise<Account>;
    deleteAccount(id: string): Promise<void>;
    getCategories(): Promise<Category[]>;
    getCategory(id: string): Promise<Category>;
    createCategory(data: CreateCategoryInput): Promise<Category>;
    updateCategory(id: string, data: UpdateCategoryInput): Promise<Category>;
    deleteCategory(id: string): Promise<void>;
    getDashboardData(): Promise<any>;
    getMonthlyReport(year: number, month: number): Promise<any>;
    getYearlyReport(year: number): Promise<any>;
}
