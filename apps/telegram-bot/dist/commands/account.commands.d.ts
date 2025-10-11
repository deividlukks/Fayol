import { Context } from 'telegraf';
export declare function contasCommand(ctx: Context): Promise<void>;
export declare function listAccountsCallback(ctx: Context): Promise<void>;
export declare function createAccountCallback(ctx: Context): Promise<void>;
export declare function handleAccountTypeCallback(ctx: Context, type: string): Promise<void>;
export declare function handleAccountNameInput(ctx: Context): Promise<void>;
export declare function handleAccountBalanceInput(ctx: Context): Promise<void>;
export declare function editAccountSelectCallback(ctx: Context): Promise<void>;
export declare function handleEditAccountCallback(ctx: Context, accountId: string): Promise<void>;
export declare function deleteAccountSelectCallback(ctx: Context): Promise<void>;
export declare function handleDeleteAccountCallback(ctx: Context, accountId: string): Promise<void>;
export declare function handleConfirmDeleteCallback(ctx: Context, accountId: string): Promise<void>;
//# sourceMappingURL=account.commands.d.ts.map