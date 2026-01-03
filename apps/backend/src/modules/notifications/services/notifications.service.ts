import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationType } from '@fayol/shared-types';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        // Mapeamento explícito resolve ambiguidades de tipo
        title: data.title,
        message: data.message,
        type: data.type as NotificationType, // Garante compatibilidade com o Enum do Prisma
        actionUrl: data.actionUrl,
        isRead: false,
        // Conexão correta via 'connect'
        user: {
          connect: { id: userId },
        },
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
