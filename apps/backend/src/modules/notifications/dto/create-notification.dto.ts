import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationType } from '@fayol/shared-types';

const createNotificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  // O enum precisa ser tratado com cuidado para bater com o tipo do Prisma
  type: z.nativeEnum(NotificationType).default(NotificationType.INFO),
  actionUrl: z.string().optional(),
});

export class CreateNotificationDto extends createZodDto(createNotificationSchema) {}
