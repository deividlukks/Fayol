import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { AuditAction } from '@fayol/database-models';

/**
 * Decorator para marcar métodos que devem ser auditados
 */
export const Auditable = (entity: string, action: AuditAction) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    descriptor.value.__audit = { entity, action };
    return descriptor;
  };
};

/**
 * Interceptor que captura e registra alterações em entidades
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const auditMetadata = (handler as any).__audit;

    // Se o método não tem metadata de auditoria, não faz nada
    if (!auditMetadata) {
      return next.handle();
    }

    const { entity, action } = auditMetadata;
    const user = request.user;
    const userId = user?.id;
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap((result) => {
        // Tenta extrair o ID da entidade do resultado
        const entityId = result?.id || result?.data?.id || undefined;

        // Determina as mudanças baseado na ação
        let changes: any = undefined;

        if (action === 'CREATE') {
          changes = { created: result };
        } else if (action === 'UPDATE') {
          changes = {
            updated: request.body,
            previous: request.__previousState, // Pode ser setado no controller
          };
        } else if (action === 'DELETE') {
          changes = { deleted: { id: entityId } };
        }

        // Cria o log de auditoria de forma assíncrona (fire and forget)
        this.auditService
          .log({
            userId,
            action,
            entity,
            entityId,
            changes,
            metadata: {
              method: request.method,
              url: request.url,
              params: request.params,
            },
            ipAddress,
            userAgent,
          })
          .catch((error) => {
            // Log silencioso para não afetar a requisição
            console.error('Erro ao criar audit log:', error);
          });
      })
    );
  }
}
