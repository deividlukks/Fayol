export declare function generateTestToken(userId: string, jwtSecret?: string): string;
export declare function extractUserIdFromToken(token: string, jwtSecret?: string): string;
export declare function createAuthHeaders(token: string): {
    Authorization: string;
};
