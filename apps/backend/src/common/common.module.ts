import { Global, Module } from '@nestjs/common';
import { SoftDeleteService } from './services/soft-delete.service';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Módulo global que fornece serviços comuns para toda a aplicação
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [SoftDeleteService],
  exports: [SoftDeleteService],
})
export class CommonModule {}
