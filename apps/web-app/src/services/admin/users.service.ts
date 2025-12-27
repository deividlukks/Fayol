import { api } from '@/lib/api';
import { UserRole } from '@fayol/shared-types';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  investorProfile: string;
}

export interface AdminUsersListResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminUsersStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  deletedUsers: number;
  usersLast30Days: number;
  growthRate: string;
}

export interface AdminUsersFilters {
  page?: number;
  pageSize?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
  includeDeleted?: boolean;
}

class AdminUsersService {
  private basePath = '/admin/users';

  /**
   * Lista todos os usuários com filtros e paginação
   */
  async list(filters: AdminUsersFilters = {}): Promise<AdminUsersListResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());
    if (filters.role) params.append('role', filters.role);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.includeDeleted) params.append('includeDeleted', filters.includeDeleted.toString());

    const response = await api.get<AdminUsersListResponse>(`${this.basePath}?${params.toString()}`);

    return response.data;
  }

  /**
   * Busca um usuário específico por ID
   */
  async getById(id: string): Promise<Omit<AdminUser, 'passwordHash'>> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Atualiza as roles de um usuário (SUPER_ADMIN apenas)
   */
  async updateRoles(id: string, roles: UserRole[]): Promise<AdminUser> {
    const response = await api.patch(`${this.basePath}/${id}/roles`, { roles });
    return response.data;
  }

  /**
   * Ativa um usuário
   */
  async activate(id: string): Promise<AdminUser> {
    const response = await api.patch(`${this.basePath}/${id}/activate`);
    return response.data;
  }

  /**
   * Desativa um usuário
   */
  async deactivate(id: string): Promise<AdminUser> {
    const response = await api.patch(`${this.basePath}/${id}/deactivate`);
    return response.data;
  }

  /**
   * Deleta um usuário (soft delete) - SUPER_ADMIN apenas
   */
  async delete(id: string): Promise<{ message: string; userId: string; deletedAt: string }> {
    const response = await api.delete(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Restaura um usuário deletado - SUPER_ADMIN apenas
   */
  async restore(id: string): Promise<{ message: string; user: AdminUser }> {
    const response = await api.patch(`${this.basePath}/${id}/restore`);
    return response.data;
  }

  /**
   * Obtém estatísticas gerais dos usuários
   */
  async getStats(): Promise<AdminUsersStatsResponse> {
    const response = await api.get(`${this.basePath}/stats/overview`);
    return response.data;
  }
}

export const adminUsersService = new AdminUsersService();
