import { HttpClient } from '../http-client';
import { ApiResponse, Category } from '@fayol/shared-types';
import { CreateCategoryInput, UpdateCategoryInput } from '@fayol/validation-schemas';

export class CategoriesService extends HttpClient {
  constructor() {
    super({ baseURL: 'http://localhost:3333/api/categories', enableRetry: true, enableCache: true });
  }

  async findAll(): Promise<ApiResponse<Category[]>> {
    return this.get<ApiResponse<Category[]>>('/');
  }

  async findOne(id: string): Promise<ApiResponse<Category>> {
    return this.get<ApiResponse<Category>>(`/${id}`);
  }

  async create(data: CreateCategoryInput): Promise<ApiResponse<Category>> {
    return this.post<ApiResponse<Category>>('/', data);
  }

  async update(id: string, data: UpdateCategoryInput): Promise<ApiResponse<Category>> {
    return this.patch<ApiResponse<Category>>(`/${id}`, data);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    return this.delete<ApiResponse<void>>(`/${id}`);
  }
}

export const categoriesService = new CategoriesService();
