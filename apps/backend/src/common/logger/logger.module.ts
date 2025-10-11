import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

/**
 * Módulo global de logging
 * Fornece o LoggerService em toda a aplicação
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
