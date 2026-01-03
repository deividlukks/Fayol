import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../../../src/modules/notifications/services/notifications.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotificationType } from '@fayol/shared-types';
import { mockPrismaFactory } from '../../utils/test-helpers';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof mockPrismaFactory>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockUser2 = {
    id: 'user-456',
    email: 'other@example.com',
    name: 'Other User',
  };

  const createMockNotification = (overrides: any = {}) => ({
    id: 'notif-' + Math.random().toString(36).substr(2, 9),
    userId: mockUser.id,
    title: 'Test Notification',
    message: 'This is a test message',
    type: NotificationType.INFO,
    isRead: false,
    actionUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = mockPrismaFactory();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== CREATE METHOD ====================

  describe('create', () => {
    const createNotificationDto = {
      title: 'Nova Notificação',
      message: 'Você tem uma nova mensagem',
      type: NotificationType.INFO,
      actionUrl: '/messages',
    };

    it('should create an INFO notification', async () => {
      const mockNotification = createMockNotification({
        ...createNotificationDto,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, createNotificationDto);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          title: createNotificationDto.title,
          message: createNotificationDto.message,
          type: createNotificationDto.type,
          actionUrl: createNotificationDto.actionUrl,
          isRead: false,
          user: {
            connect: { id: mockUser.id },
          },
        },
      });
      expect(result).toEqual(mockNotification);
      expect(result.type).toBe(NotificationType.INFO);
    });

    it('should create a WARNING notification', async () => {
      const warningDto = {
        ...createNotificationDto,
        type: NotificationType.WARNING,
        title: 'Atenção!',
      };

      const mockNotification = createMockNotification({
        ...warningDto,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, warningDto);

      expect(result.type).toBe(NotificationType.WARNING);
    });

    it('should create a SUCCESS notification', async () => {
      const successDto = {
        ...createNotificationDto,
        type: NotificationType.SUCCESS,
        title: 'Sucesso!',
      };

      const mockNotification = createMockNotification({
        ...successDto,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, successDto);

      expect(result.type).toBe(NotificationType.SUCCESS);
    });

    it('should create an ERROR notification', async () => {
      const errorDto = {
        ...createNotificationDto,
        type: NotificationType.ERROR,
        title: 'Erro!',
      };

      const mockNotification = createMockNotification({
        ...errorDto,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, errorDto);

      expect(result.type).toBe(NotificationType.ERROR);
    });

    it('should create notification without actionUrl', async () => {
      const dtoWithoutUrl = {
        title: 'Notificação Simples',
        message: 'Sem ação',
        type: NotificationType.INFO,
        actionUrl: undefined,
      };

      const mockNotification = createMockNotification({
        ...dtoWithoutUrl,
        userId: mockUser.id,
        actionUrl: null,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithoutUrl);

      expect(result.actionUrl).toBeNull();
    });

    it('should create notification with actionUrl', async () => {
      const dtoWithUrl = {
        ...createNotificationDto,
        actionUrl: '/budgets/123',
      };

      const mockNotification = createMockNotification({
        ...dtoWithUrl,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithUrl);

      expect(result.actionUrl).toBe('/budgets/123');
    });

    it('should always set isRead to false for new notifications', async () => {
      const mockNotification = createMockNotification({
        ...createNotificationDto,
        userId: mockUser.id,
        isRead: false,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, createNotificationDto);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isRead: false,
        }),
      });
      expect(result.isRead).toBe(false);
    });

    it('should create notification for different user', async () => {
      const mockNotification = createMockNotification({
        ...createNotificationDto,
        userId: mockUser2.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser2.id, createNotificationDto);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user: {
            connect: { id: mockUser2.id },
          },
        }),
      });
      expect(result.userId).toBe(mockUser2.id);
    });

    it('should create notification with long title', async () => {
      const longTitle = 'A'.repeat(200);
      const dtoWithLongTitle = {
        ...createNotificationDto,
        title: longTitle,
      };

      const mockNotification = createMockNotification({
        ...dtoWithLongTitle,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithLongTitle);

      expect(result.title).toBe(longTitle);
    });

    it('should create notification with long message', async () => {
      const longMessage = 'M'.repeat(1000);
      const dtoWithLongMessage = {
        ...createNotificationDto,
        message: longMessage,
      };

      const mockNotification = createMockNotification({
        ...dtoWithLongMessage,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithLongMessage);

      expect(result.message).toBe(longMessage);
    });

    it('should create notification with special characters in message', async () => {
      const specialMessage = 'Olá! Você tem R$ 100,00 em <nova transação>';
      const dtoWithSpecial = {
        ...createNotificationDto,
        message: specialMessage,
      };

      const mockNotification = createMockNotification({
        ...dtoWithSpecial,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithSpecial);

      expect(result.message).toBe(specialMessage);
    });

    it('should create notification with unicode characters', async () => {
      const unicodeTitle = 'Notificação 日本語 中文';
      const dtoWithUnicode = {
        ...createNotificationDto,
        title: unicodeTitle,
      };

      const mockNotification = createMockNotification({
        ...dtoWithUnicode,
        userId: mockUser.id,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithUnicode);

      expect(result.title).toBe(unicodeTitle);
    });

    it('should create multiple notifications for same user', async () => {
      const notif1 = createMockNotification({ id: 'notif-1' });
      const notif2 = createMockNotification({ id: 'notif-2' });

      prisma.notification.create.mockResolvedValueOnce(notif1 as any);
      prisma.notification.create.mockResolvedValueOnce(notif2 as any);

      await service.create(mockUser.id, createNotificationDto);
      await service.create(mockUser.id, createNotificationDto);

      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    });
  });

  // ==================== FINDALL METHOD ====================

  describe('findAll', () => {
    it('should return all notifications for user ordered by createdAt desc', async () => {
      const mockNotifications = [
        createMockNotification({
          id: 'notif-3',
          createdAt: new Date('2024-01-03'),
        }),
        createMockNotification({
          id: 'notif-2',
          createdAt: new Date('2024-01-02'),
        }),
        createMockNotification({
          id: 'notif-1',
          createdAt: new Date('2024-01-01'),
        }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await service.findAll(mockUser.id);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockNotifications);
      expect(result).toHaveLength(3);
    });

    it('should return empty array if user has no notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([]);

      const result = await service.findAll(mockUser.id);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return both read and unread notifications', async () => {
      const mockNotifications = [
        createMockNotification({
          id: 'notif-1',
          isRead: true,
        }),
        createMockNotification({
          id: 'notif-2',
          isRead: false,
        }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result.some((n: any) => n.isRead)).toBe(true);
      expect(result.some((n: any) => !n.isRead)).toBe(true);
    });

    it('should return notifications of all types', async () => {
      const mockNotifications = [
        createMockNotification({ type: NotificationType.INFO }),
        createMockNotification({ type: NotificationType.WARNING }),
        createMockNotification({ type: NotificationType.SUCCESS }),
        createMockNotification({ type: NotificationType.ERROR }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(4);
      expect(result.map((n: any) => n.type)).toContain(NotificationType.INFO);
      expect(result.map((n: any) => n.type)).toContain(NotificationType.WARNING);
      expect(result.map((n: any) => n.type)).toContain(NotificationType.SUCCESS);
      expect(result.map((n: any) => n.type)).toContain(NotificationType.ERROR);
    });

    it('should not return notifications from other users', async () => {
      const mockNotifications = [
        createMockNotification({
          userId: mockUser.id,
        }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      await service.findAll(mockUser.id);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return notifications with and without actionUrl', async () => {
      const mockNotifications = [
        createMockNotification({
          actionUrl: '/budgets',
        }),
        createMockNotification({
          actionUrl: null,
        }),
      ];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(2);
      expect(result[0].actionUrl).toBe('/budgets');
      expect(result[1].actionUrl).toBeNull();
    });

    it('should return large number of notifications', async () => {
      const mockNotifications = Array.from({ length: 100 }, (_, i) =>
        createMockNotification({
          id: `notif-${i}`,
        })
      );

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(100);
    });

    it('should return single notification', async () => {
      const mockNotifications = [createMockNotification()];

      prisma.notification.findMany.mockResolvedValue(mockNotifications as any);

      const result = await service.findAll(mockUser.id);

      expect(result).toHaveLength(1);
    });

    it('should handle multiple calls for different users', async () => {
      const user1Notifications = [
        createMockNotification({ userId: mockUser.id }),
      ];
      const user2Notifications = [
        createMockNotification({ userId: mockUser2.id }),
      ];

      prisma.notification.findMany.mockResolvedValueOnce(user1Notifications as any);
      prisma.notification.findMany.mockResolvedValueOnce(user2Notifications as any);

      await service.findAll(mockUser.id);
      await service.findAll(mockUser2.id);

      expect(prisma.notification.findMany).toHaveBeenCalledTimes(2);
      expect(prisma.notification.findMany).toHaveBeenNthCalledWith(1, {
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.notification.findMany).toHaveBeenNthCalledWith(2, {
        where: { userId: mockUser2.id },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ==================== MARKASREAD METHOD ====================

  describe('markAsRead', () => {
    const notificationId = 'notif-123';

    it('should mark notification as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await service.markAsRead(notificationId, mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: notificationId, userId: mockUser.id },
        data: { isRead: true },
      });
      expect(result.count).toBe(1);
    });

    it('should check ownership before marking as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);

      await service.markAsRead(notificationId, mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockUser.id,
        }),
        data: { isRead: true },
      });
    });

    it('should return count 0 when notification not found', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.markAsRead('non-existent-id', mockUser.id);

      expect(result.count).toBe(0);
    });

    it('should return count 0 when notification belongs to other user', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.markAsRead(notificationId, mockUser2.id);

      expect(result.count).toBe(0);
    });

    it('should mark already read notification as read (idempotent)', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await service.markAsRead(notificationId, mockUser.id);

      expect(result.count).toBe(1);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: notificationId, userId: mockUser.id },
        data: { isRead: true },
      });
    });

    it('should handle multiple markAsRead calls for different notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);

      await service.markAsRead('notif-1', mockUser.id);
      await service.markAsRead('notif-2', mockUser.id);
      await service.markAsRead('notif-3', mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent markAsRead calls', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);

      await Promise.all([
        service.markAsRead('notif-1', mockUser.id),
        service.markAsRead('notif-2', mockUser.id),
        service.markAsRead('notif-3', mockUser.id),
      ]);

      expect(prisma.notification.updateMany).toHaveBeenCalledTimes(3);
    });
  });

  // ==================== MARKALLASREAD METHOD ====================

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 } as any);

      const result = await service.markAllAsRead(mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isRead: false },
        data: { isRead: true },
      });
      expect(result.count).toBe(5);
    });

    it('should only mark unread notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 } as any);

      await service.markAllAsRead(mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          isRead: false,
        }),
        data: { isRead: true },
      });
    });

    it('should check user ownership', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 5 } as any);

      await service.markAllAsRead(mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockUser.id,
        }),
        data: { isRead: true },
      });
    });

    it('should return count 0 when user has no unread notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.markAllAsRead(mockUser.id);

      expect(result.count).toBe(0);
    });

    it('should return count 0 when user has no notifications at all', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);

      const result = await service.markAllAsRead('user-without-notifications');

      expect(result.count).toBe(0);
    });

    it('should mark single unread notification', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await service.markAllAsRead(mockUser.id);

      expect(result.count).toBe(1);
    });

    it('should mark large number of unread notifications', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 100 } as any);

      const result = await service.markAllAsRead(mockUser.id);

      expect(result.count).toBe(100);
    });

    it('should be idempotent when called multiple times', async () => {
      prisma.notification.updateMany.mockResolvedValueOnce({ count: 5 } as any);
      prisma.notification.updateMany.mockResolvedValueOnce({ count: 0 } as any);

      const result1 = await service.markAllAsRead(mockUser.id);
      const result2 = await service.markAllAsRead(mockUser.id);

      expect(result1.count).toBe(5);
      expect(result2.count).toBe(0); // Already marked
    });

    it('should not affect notifications of other users', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 } as any);

      await service.markAllAsRead(mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isRead: false },
        data: { isRead: true },
      });
      // Should not have been called with mockUser2.id
    });

    it('should handle concurrent markAllAsRead calls for different users', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 3 } as any);

      await Promise.all([
        service.markAllAsRead(mockUser.id),
        service.markAllAsRead(mockUser2.id),
      ]);

      expect(prisma.notification.updateMany).toHaveBeenCalledTimes(2);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, isRead: false },
        data: { isRead: true },
      });
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser2.id, isRead: false },
        data: { isRead: true },
      });
    });
  });

  // ==================== EDGE CASES ====================

  describe('edge cases', () => {
    it('should handle very long notification IDs in markAsRead', async () => {
      const longId = 'x'.repeat(256);
      prisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);

      await service.markAsRead(longId, mockUser.id);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: longId, userId: mockUser.id },
        data: { isRead: true },
      });
    });

    it('should handle special characters in user ID', async () => {
      const specialUserId = 'user-with-special-chars-@#$%';
      prisma.notification.updateMany.mockResolvedValue({ count: 0 } as any);

      await service.markAllAsRead(specialUserId);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: specialUserId, isRead: false },
        data: { isRead: true },
      });
    });

    it('should create notification with empty string actionUrl', async () => {
      const dtoWithEmptyUrl = {
        title: 'Test',
        message: 'Message',
        type: NotificationType.INFO,
        actionUrl: '',
      };

      const mockNotification = createMockNotification({
        ...dtoWithEmptyUrl,
      });

      prisma.notification.create.mockResolvedValue(mockNotification as any);

      const result = await service.create(mockUser.id, dtoWithEmptyUrl);

      expect(result.actionUrl).toBe('');
    });

    it('should handle findAll for user with UUID as ID', async () => {
      const uuidUser = '550e8400-e29b-41d4-a716-446655440000';
      prisma.notification.findMany.mockResolvedValue([]);

      await service.findAll(uuidUser);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: uuidUser },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
