import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@fayol/database-models';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
