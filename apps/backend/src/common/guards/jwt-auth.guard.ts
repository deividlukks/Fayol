import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Você pode lançar uma exceção personalizada aqui se desejar
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou expirado.');
    }
    return user;
  }
}
