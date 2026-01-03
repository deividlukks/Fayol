import { HttpClient } from '../http-client';
import { User, UserRole } from '@fayol/shared-types';

export interface AdminUsersFilters {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  includeDeleted?: boolean;
}

export interface AdminUsersListResponse {
  data: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUsersStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  deletedUsers: number;
  usersLast30Days: number;
  growthRate: string;
}

export class AdminUsersService extends HttpClient {
  constructor() {
    super({ 
      baseURL: 'http://localhost:3333/api/admin/users', 
      enableRetry: true, 
      enableCache: false 
    }); 
  }

  async list(filters: AdminUsersFilters = {}): Promise<AdminUsersListResponse> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.search) params.append('search', filters.search);
    if (filters.includeDeleted) params.append('includeDeleted', 'true');

    return this.get<AdminUsersListResponse>(`/?${params.toString()}`);
  }

  async getStats(): Promise<AdminUsersStats> {
    return this.get<AdminUsersStats>('/stats/overview');
  }

  async findOne(id: string): Promise<User> {
    return this.get<User>(`/${id}`);
  }

  async updateRoles(id: string, roles: UserRole[]): Promise<User> {
    return this.patch<User>(`/${id}/roles`, { roles });
  }

  async activate(id: string): Promise<User> {
    return this.patch<User>(`/${id}/activate`);
  }

  async deactivate(id: string): Promise<User> {
    return this.patch<User>(`/${id}/deactivate`);
  }

  // Renomeado para 'remove' para evitar conflito com o 'delete' do HttpClient
  async remove(id: string): Promise<{ message: string; userId: string; deletedAt: Date }> {
    return this.delete<{ message: string; userId: string; deletedAt: Date }>(`/${id}`);
  }

  async restore(id: string): Promise<{ message: string; user: User }> {
    return this.patch<{ message: string; user: User }>(`/${id}/restore`);
  }
}

export const adminUsersService = new AdminUsersService();