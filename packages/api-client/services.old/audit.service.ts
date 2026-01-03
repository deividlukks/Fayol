import { HttpClient } from '../http-client';
import { AuditAction } from '@fayol/database-models'; 

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  user?: {
    name: string;
    email: string;
  };
}

export interface AuditLogsFilters {
  userId?: string;
  entity?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export interface AuditLogsListResponse {
  data: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export class AuditService extends HttpClient {
  constructor() {
    super({ 
      baseURL: 'http://localhost:3333/api/audit', 
      enableRetry: true, 
      enableCache: false 
    });
  }

  async list(filters: AuditLogsFilters = {}): Promise<AuditLogsListResponse> {
    const params = new URLSearchParams();
    
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.entity) params.append('entity', filters.entity);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.action) params.append('action', filters.action);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    return this.get<AuditLogsListResponse>(`/?${params.toString()}`);
  }

  async getByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    const params = new URLSearchParams({ entity, entityId });
    return this.get<AuditLog[]>(`/entity?${params.toString()}`);
  }

  async getByUser(userId: string, page = 1, pageSize = 50): Promise<AuditLogsListResponse> {
    const params = new URLSearchParams({ 
      userId, 
      page: page.toString(), 
      pageSize: pageSize.toString() 
    });
    return this.get<AuditLogsListResponse>(`/user?${params.toString()}`);
  }
}

export const auditService = new AuditService();