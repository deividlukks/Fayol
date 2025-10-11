"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTestToken = generateTestToken;
exports.extractUserIdFromToken = extractUserIdFromToken;
exports.createAuthHeaders = createAuthHeaders;
const jwt_1 = require("@nestjs/jwt");
function generateTestToken(userId, jwtSecret) {
    const jwtService = new jwt_1.JwtService({
        secret: jwtSecret || process.env.JWT_SECRET || 'test-secret-key-for-testing',
    });
    return jwtService.sign({
        sub: userId,
        email: `test-${userId}@test.com`,
    });
}
function extractUserIdFromToken(token, jwtSecret) {
    const jwtService = new jwt_1.JwtService({
        secret: jwtSecret || process.env.JWT_SECRET || 'test-secret-key-for-testing',
    });
    const decoded = jwtService.verify(token);
    return decoded.sub;
}
function createAuthHeaders(token) {
    return {
        Authorization: `Bearer ${token}`,
    };
}
//# sourceMappingURL=auth.helper.js.map