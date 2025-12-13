import { useState, useEffect, useCallback } from 'react';
import { adminUsersService, AdminUsersFilters, AdminUsersStats } from '@fayol/api-client';
import { User } from '@fayol/shared-types';

export function useAdminUsers(initialFilters: AdminUsersFilters = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialFilters.page || 1);
  const [pageSize, setPageSize] = useState(initialFilters.pageSize || 50);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminUsersFilters>(initialFilters);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await adminUsersService.list({
        ...filters,
        page,
        pageSize,
      });

      setUsers(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar usuários');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const activate = async (id: string) => {
    try {
      await adminUsersService.activate(id);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao ativar usuário');
    }
  };

  const deactivate = async (id: string) => {
    try {
      await adminUsersService.deactivate(id);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao desativar usuário');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      // CORREÇÃO: Usando .remove() em vez de .delete()
      await adminUsersService.remove(id);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao deletar usuário');
    }
  };

  const restoreUser = async (id: string) => {
    try {
      await adminUsersService.restore(id);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao restaurar usuário');
    }
  };

  const updateRoles = async (id: string, roles: any[]) => {
    try {
      await adminUsersService.updateRoles(id, roles);
      await fetchUsers();
    } catch (err: any) {
      throw new Error(err.message || 'Erro ao atualizar roles');
    }
  };

  const updateFilters = (newFilters: Partial<AdminUsersFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return {
    users,
    total,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    filters,
    setPage,
    setPageSize,
    updateFilters,
    refresh: fetchUsers,
    activate,
    deactivate,
    deleteUser,
    restoreUser,
    updateRoles,
  };
}

export function useAdminUsersStats() {
  const [stats, setStats] = useState<AdminUsersStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminUsersService.getStats();
      setStats(response);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar estatísticas');
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
