import { Context } from 'telegraf';
export declare function startCommand(ctx: Context): Promise<void>;
export declare function loginCommand(ctx: Context): Promise<void>;
export declare function showLoginOptions(ctx: Context): Promise<void>;
export declare function logoutCommand(ctx: Context): Promise<void>;
export declare function handleLoginFlow(ctx: Context): Promise<void>;
export declare function handleLoginCallback(ctx: Context): Promise<void>;
export declare function handleLoginEmailCallback(ctx: Context): Promise<void>;
export declare function handleLoginPhoneCallback(ctx: Context): Promise<void>;
export declare function handleLoginCPFCallback(ctx: Context): Promise<void>;
//# sourceMappingURL=auth.commands.d.ts.map