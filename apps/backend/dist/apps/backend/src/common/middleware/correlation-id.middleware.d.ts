import { NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
export declare class CorrelationIdMiddleware implements NestMiddleware {
    use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void): void;
}
