import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service'; // Import ajustado
import { UsersController } from './controllers/users.controller'; // Import ajustado

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
