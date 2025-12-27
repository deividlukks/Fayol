import { api } from '@/lib/api';

export interface AuditLog {
  id: string;
  userId: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'LOGIN' | 'LOGOUT' | 'ACCESS';
  entity: string;
  entityId: string | null;
  changes: Record<string, unknown>;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsListResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditLogsFilters {
  userId?: string;
  entity?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

class AdminAuditService {
  private basePath = '/audit';

  /**
   * Lista logs de auditoria com filtros
   */
  async list(filters: AuditLogsFilters = {}): Promise<AuditLogsListResponse> {
    const params = new URLSearchParams();

    if (filters.userId) params.append('userId', filters.userId);
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.action) params.append('action', filters.action);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await api.get<AuditLogsListResponse>(`${this.basePath}?${params.toString()}`);

    return response.data;
  }

  /**
   * Busca logs de uma entidade específica
   */
  async getByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const params = new URLSearchParams({
      entity,
      entityId,
    });

    const response = await api.get(`${this.basePath}/entity?${params.toString()}`);
    return response.data;
  }

  /**
   * Busca logs de um usuário específico
   */
  async getByUser(userId: string, page = 1, pageSize = 50): Promise<AuditLogsListResponse> {
    const params = new URLSearchParams({
      userId,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await api.get(`${this.basePath}/user?${params.toString()}`);
    return response.data;
  }
}

export const adminAuditService = new AdminAuditService();
