export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[] | Record<string, string[]>;
  timestamp: string;
}
