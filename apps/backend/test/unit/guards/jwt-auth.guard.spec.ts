import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/common/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('canActivate', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should call super.canActivate', () => {
      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: { authorization: 'Bearer valid-token' },
          }),
        }),
      } as unknown as ExecutionContext;

      const superCanActivate = jest.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate'
      );

      guard.canActivate(context);

      expect(superCanActivate).toHaveBeenCalled();
    });
  });

  describe('handleRequest', () => {
    it('should return user when valid', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        roles: ['USER'],
      };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);

      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow('Token inválido ou expirado.');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest(null, undefined, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw error when error is provided', () => {
      const error = new Error('Token expired');

      expect(() => {
        guard.handleRequest(error, null, null);
      }).toThrow(error);
    });

    it('should throw original error over UnauthorizedException', () => {
      const customError = new Error('Custom authentication error');

      expect(() => {
        guard.handleRequest(customError, null, null);
      }).toThrow(customError);
    });

    it('should handle valid user with all required properties', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['USER', 'ADMIN'],
      };

      const result = guard.handleRequest(null, user, null);

      expect(result).toHaveProperty('id', 'user-123');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).toHaveProperty('roles');
      expect(result.roles).toContain('USER');
      expect(result.roles).toContain('ADMIN');
    });
  });
});
