import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

    // Adiciona o correlation ID ao request
    req.headers['x-correlation-id'] = correlationId;

    // Adiciona o correlation ID ao response (Fastify usa setHeader)
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
