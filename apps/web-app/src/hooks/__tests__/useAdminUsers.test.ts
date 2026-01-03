import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminUsers, useAdminUsersStats } from '../useAdminUsers';
import { adminUsersService } from '@fayol/api-client';
import { UserRole, InvestorProfile, User } from '@fayol/shared-types';

// Mock do serviço
jest.mock('@fayol/api-client', () => ({
  adminUsersService: {
    list: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    remove: jest.fn(),
    restore: jest.fn(),
    updateRoles: jest.fn(),
    getStats: jest.fn(),
  },
}));

const mockAdminUsersService = adminUsersService as jest.Mocked<typeof adminUsersService>;

describe('useAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });

    const { result } = renderHook(() => useAdminUsers());

    expect(result.current.users).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(50);
    expect(result.current.totalPages).toBe(0);
    expect(result.current.isLoading).toBe(true); // Loading durante fetch inicial
    expect(result.current.error).toBeNull();
  });

  it('deve carregar usuários com sucesso', async () => {
    const mockUsers: User[] = [
      {
        id: '1',
        name: 'User 1',
        email: 'user1@test.com',
        roles: [UserRole.USER],
        investorProfile: InvestorProfile.CONSERVATIVE,
        onboardingStep: 5,
        mainCurrency: 'BRL',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: 'User 2',
        email: 'user2@test.com',
        roles: [UserRole.USER],
        investorProfile: InvestorProfile.MODERATE,
        onboardingStep: 5,
        mainCurrency: 'BRL',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockAdminUsersService.list.mockResolvedValue({
      data: mockUsers,
      total: 2,
      totalPages: 1,
      page: 1,
      pageSize: 50,
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.users).toEqual(mockUsers);
    expect(result.current.total).toBe(2);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erro ao carregar usuários', async () => {
    const errorMessage = 'Erro de rede';
    mockAdminUsersService.list.mockRejectedValue(new Error(errorMessage));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.users).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('deve usar filtros iniciais', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 2,
      pageSize: 10,
    });

    const initialFilters = { page: 2, pageSize: 10, role: UserRole.ADMIN };
    renderHook(() => useAdminUsers(initialFilters));

    await waitFor(() => {
      expect(mockAdminUsersService.list).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          pageSize: 10,
          role: UserRole.ADMIN,
        })
      );
    });
  });

  it('deve ativar usuário com sucesso', async () => {
    const mockUser: User = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      roles: [UserRole.USER],
      investorProfile: InvestorProfile.CONSERVATIVE,
      onboardingStep: 5,
      mainCurrency: 'BRL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.activate.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.activate('user-1');
    });

    expect(mockAdminUsersService.activate).toHaveBeenCalledWith('user-1');
    expect(mockAdminUsersService.list).toHaveBeenCalledTimes(2); // Initial + refresh
  });

  it('deve lançar erro ao falhar ativação', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.activate.mockRejectedValue(new Error('Falha na ativação'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.activate('user-1')).rejects.toThrow('Falha na ativação');
  });

  it('deve desativar usuário com sucesso', async () => {
    const mockUser: User = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      roles: [UserRole.USER],
      investorProfile: InvestorProfile.CONSERVATIVE,
      onboardingStep: 5,
      mainCurrency: 'BRL',
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.deactivate.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deactivate('user-1');
    });

    expect(mockAdminUsersService.deactivate).toHaveBeenCalledWith('user-1');
  });

  it('deve lançar erro ao falhar desativação', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.deactivate.mockRejectedValue(new Error('Falha na desativação'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.deactivate('user-1')).rejects.toThrow('Falha na desativação');
  });

  it('deve deletar usuário com sucesso', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.remove.mockResolvedValue({
      message: 'User deleted',
      userId: 'user-1',
      deletedAt: new Date(),
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteUser('user-1');
    });

    expect(mockAdminUsersService.remove).toHaveBeenCalledWith('user-1');
  });

  it('deve lançar erro ao falhar deleção', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.remove.mockRejectedValue(new Error('Falha na deleção'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.deleteUser('user-1')).rejects.toThrow('Falha na deleção');
  });

  it('deve restaurar usuário com sucesso', async () => {
    const mockUser: User = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      roles: [UserRole.USER],
      investorProfile: InvestorProfile.CONSERVATIVE,
      onboardingStep: 5,
      mainCurrency: 'BRL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.restore.mockResolvedValue({
      message: 'User restored',
      user: mockUser,
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.restoreUser('user-1');
    });

    expect(mockAdminUsersService.restore).toHaveBeenCalledWith('user-1');
  });

  it('deve lançar erro ao falhar restauração', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.restore.mockRejectedValue(new Error('Falha na restauração'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.restoreUser('user-1')).rejects.toThrow('Falha na restauração');
  });

  it('deve atualizar roles com sucesso', async () => {
    const mockUser: User = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@test.com',
      roles: [UserRole.ADMIN, UserRole.USER],
      investorProfile: InvestorProfile.CONSERVATIVE,
      onboardingStep: 5,
      mainCurrency: 'BRL',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.updateRoles.mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newRoles = [UserRole.ADMIN, UserRole.USER];
    await act(async () => {
      await result.current.updateRoles('user-1', newRoles);
    });

    expect(mockAdminUsersService.updateRoles).toHaveBeenCalledWith('user-1', newRoles);
  });

  it('deve lançar erro ao falhar atualização de roles', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });
    mockAdminUsersService.updateRoles.mockRejectedValue(new Error('Falha ao atualizar roles'));

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.updateRoles('user-1', [])).rejects.toThrow(
      'Falha ao atualizar roles'
    );
  });

  it('deve atualizar filtros e resetar para página 1', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mudar para página 2
    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.page).toBe(2);

    // Atualizar filtros deve resetar para página 1
    act(() => {
      result.current.updateFilters({ role: UserRole.ADMIN });
    });

    expect(result.current.page).toBe(1);
    expect(result.current.filters).toEqual(expect.objectContaining({ role: UserRole.ADMIN }));
  });

  it('deve atualizar pageSize', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setPageSize(100);
    });

    expect(result.current.pageSize).toBe(100);
  });

  it('deve executar refresh manualmente', async () => {
    mockAdminUsersService.list.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 50,
    });

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockAdminUsersService.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockAdminUsersService.list).toHaveBeenCalledTimes(2);
  });

  it('deve lidar com erro genérico sem mensagem', async () => {
    mockAdminUsersService.list.mockRejectedValue({});

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAdminUsers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao carregar usuários');

    consoleSpy.mockRestore();
  });
});

describe('useAdminUsersStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve inicializar com valores padrão', () => {
    mockAdminUsersService.getStats.mockResolvedValue({
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      deletedUsers: 0,
      usersLast30Days: 0,
      growthRate: '0%',
    });

    const { result } = renderHook(() => useAdminUsersStats());

    expect(result.current.stats).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('deve carregar estatísticas com sucesso', async () => {
    const mockStats = {
      totalUsers: 100,
      activeUsers: 80,
      inactiveUsers: 20,
      deletedUsers: 5,
      usersLast30Days: 15,
      growthRate: '15%',
    };

    mockAdminUsersService.getStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useAdminUsersStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.error).toBeNull();
  });

  it('deve lidar com erro ao carregar estatísticas', async () => {
    const errorMessage = 'Erro ao buscar stats';
    mockAdminUsersService.getStats.mockRejectedValue(new Error(errorMessage));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAdminUsersStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.stats).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('deve executar refresh manualmente', async () => {
    mockAdminUsersService.getStats.mockResolvedValue({
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      deletedUsers: 0,
      usersLast30Days: 0,
      growthRate: '0%',
    });

    const { result } = renderHook(() => useAdminUsersStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockAdminUsersService.getStats).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockAdminUsersService.getStats).toHaveBeenCalledTimes(2);
  });

  it('deve lidar com erro genérico sem mensagem', async () => {
    mockAdminUsersService.getStats.mockRejectedValue({});

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAdminUsersStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Erro ao carregar estatísticas');

    consoleSpy.mockRestore();
  });
});
