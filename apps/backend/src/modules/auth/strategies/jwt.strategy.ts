import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service'; // Import ajustado
import { Request } from 'express';

/**
 * Interface para o payload do JWT
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

// Função para extrair JWT do cookie ou header
const extractJwtFromCookieOrHeader = (req: Request) => {
  let token = null;

  // 1. Tenta extrair do cookie (httpOnly)
  if (req && req.cookies && req.cookies.access_token) {
    token = req.cookies.access_token;
  }

  // 2. Se não encontrou no cookie, tenta do header Authorization (fallback para compatibilidade)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is not configured. Please set it in your .env file.'
      );
    }

    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Valida estrutura do payload
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid JWT payload: missing or invalid user ID');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    return user;
  }
}
