import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { UserDeletionService } from './services/user-deletion.service';
import { UsersController } from './controllers/users.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AuditModule } from '../audit/audit.module';
import { ConsentModule } from '../../consent/consent.module';

@Module({
  imports: [AuditModule, ConsentModule],
  controllers: [UsersController, AdminUsersController],
  providers: [UsersService, UserDeletionService],
  exports: [UsersService, UserDeletionService],
})
export class UsersModule {}
