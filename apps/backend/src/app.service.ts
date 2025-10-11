import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Fayol API - Sistema de Gestão Financeira Pessoal com IA',
      version: '0.1.0',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }

  healthCheck(): object {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
  }
}
