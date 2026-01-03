import { HttpClient } from '../http-client';

export interface HealthCheckResult {
  status: 'ok' | 'error' | 'shutting_down';
  info?: Record<string, { status: string; [key: string]: any }>;
  error?: Record<string, { status: string; [key: string]: any }>;
  details: Record<string, { status: string; [key: string]: any }>;
}

export interface SystemHealthSummary {
  api: boolean;
  database: boolean;
  redis: boolean;
  aiService: boolean;
  uptime: number; // em segundos
}

export class HealthService extends HttpClient {
  constructor() {
    super({ 
      baseURL: 'http://localhost:3333/health',
      enableRetry: false 
    });
  }

  async check(): Promise<HealthCheckResult> {
    return this.get<HealthCheckResult>('/');
  }

  async checkAi(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/ai-service');
  }
}

export const healthService = new HealthService();