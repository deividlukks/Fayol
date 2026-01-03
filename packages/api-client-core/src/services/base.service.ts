import { HttpClient } from '../http-client';
import { ApiResponse } from '@fayol/shared-types';
import { IStorageAdapter } from '../storage.interface';

/**
 * Base Service Factory
 *
 * Factory genérico para criar services com operações CRUD padrão
 */
export class BaseService<T = unknown> extends HttpClient {
  constructor(
    storage: IStorageAdapter,
    baseURL: string,
    enableCache: boolean = true
  ) {
    super({
      baseURL,
      enableRetry: true,
      enableCache,
      storage,
    });
  }

  /**
   * Lista todos os recursos
   */
  async findAll(params?: Record<string, unknown>): Promise<ApiResponse<T[]>> {
    return this.get<ApiResponse<T[]>>('/', { params });
  }

  /**
   * Busca um recurso por ID
   */
  async findOne(id: string): Promise<ApiResponse<T>> {
    return this.get<ApiResponse<T>>(`/${id}`);
  }

  /**
   * Cria um novo recurso
   */
  async create(data: Partial<T>): Promise<ApiResponse<T>> {
    return this.post<ApiResponse<T>>('/', data);
  }

  /**
   * Atualiza um recurso
   */
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>> {
    return this.patch<ApiResponse<T>>(`/${id}`, data);
  }

  /**
   * Remove um recurso
   */
  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }
}
