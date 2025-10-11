export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    message?: string;
}
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    statusCode: number;
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ApiErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}
