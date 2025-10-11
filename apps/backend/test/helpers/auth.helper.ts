import { JwtService } from '@nestjs/jwt';

/**
 * Helper para gerar token JWT de teste
 * Útil para testar rotas protegidas
 */
export function generateTestToken(userId: string, jwtSecret?: string): string {
  const jwtService = new JwtService({
    secret: jwtSecret || process.env.JWT_SECRET || 'test-secret-key-for-testing',
  });

  return jwtService.sign({
    sub: userId,
    email: `test-${userId}@test.com`,
  });
}

/**
 * Helper para extrair userId de um token JWT
 */
export function extractUserIdFromToken(token: string, jwtSecret?: string): string {
  const jwtService = new JwtService({
    secret: jwtSecret || process.env.JWT_SECRET || 'test-secret-key-for-testing',
  });

  const decoded = jwtService.verify(token);
  return decoded.sub;
}

/**
 * Helper para criar headers de autenticação para testes
 */
export function createAuthHeaders(token: string): { Authorization: string } {
  return {
    Authorization: `Bearer ${token}`,
  };
}
