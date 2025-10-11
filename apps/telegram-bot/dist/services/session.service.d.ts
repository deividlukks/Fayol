import { UserSession } from './api.service';
export declare class SessionService {
    private sessions;
    private userStates;
    private getSessionKey;
    private getStateKey;
    saveSession(telegramId: number, session: UserSession): Promise<void>;
    getSession(telegramId: number): Promise<UserSession | null>;
    deleteSession(telegramId: number): Promise<void>;
    isAuthenticated(telegramId: number): Promise<boolean>;
    saveUserState(telegramId: number, state: any): Promise<void>;
    getUserState(telegramId: number): Promise<any>;
    clearUserState(telegramId: number): Promise<void>;
    getAllSessions(): Promise<number[]>;
}
export declare const sessionService: SessionService;
//# sourceMappingURL=session.service.d.ts.map