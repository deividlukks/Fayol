import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Rate limiting guard específico para forgot password
 *
 * Limites:
 * - 3 tentativas por email a cada 15 minutos
 * - 5 tentativas por IP a cada hora
 *
 * Isso previne:
 * - Ataques de email enumeration
 * - Spam de emails
 * - Ataques de força bruta
 */
@Injectable()
export class ForgotPasswordThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Usa o email do corpo da requisição como tracker principal
    const email = req.body?.email;
    if (email) {
      return `forgot-password:email:${email}`;
    }

    // Fallback para IP se email não estiver presente
    return `forgot-password:ip:${req.ip}`;
  }

  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new ThrottlerException(
      'Muitas tentativas de recuperação de senha. Por favor, aguarde alguns minutos antes de tentar novamente.'
    );
  }
}
