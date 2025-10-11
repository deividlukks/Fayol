export declare enum AccountType {
    CHECKING = "CHECKING",
    SAVINGS = "SAVINGS",
    INVESTMENT = "INVESTMENT",
    CREDIT_CARD = "CREDIT_CARD",
    CASH = "CASH",
    OTHER = "OTHER"
}
export interface Account {
    id: string;
    userId: string;
    name: string;
    type: AccountType;
    balance: number;
    initialBalance: number;
    color?: string;
    icon?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateAccountInput {
    name: string;
    type: AccountType;
    initialBalance: number;
    color?: string;
    icon?: string;
}
export interface UpdateAccountInput {
    name?: string;
    type?: AccountType;
    color?: string;
    icon?: string;
    isActive?: boolean;
}
export interface AccountSummary {
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    color?: string;
    icon?: string;
}
