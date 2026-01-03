import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Verificação completa de saúde do sistema' })
  @ApiResponse({ status: 200, description: 'Sistema saudável' })
  @ApiResponse({ status: 503, description: 'Sistema com problemas' })
  check() {
    return this.health.check([
      // Verifica conexão com banco de dados
      () => this.prismaHealth.pingCheck('database', this.prisma),

      // Verifica uso de memória (alerta se > 150MB heap)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Verifica uso de disco (alerta se > 90%)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('ai-service')
  @HealthCheck()
  @ApiOperation({ summary: 'Verificação do serviço Python AI' })
  checkAiService() {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    return this.health.check([
      () =>
        this.http.pingCheck('python-ai', `${aiServiceUrl}/health`, {
          timeout: 3000,
        }),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificação de prontidão (readiness probe)' })
  @ApiResponse({ status: 200, description: 'Serviço pronto' })
  async ready() {
    try {
      // Testa conexão básica com o banco
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Verificação de vitalidade (liveness probe)' })
  @ApiResponse({ status: 200, description: 'Serviço ativo' })
  live() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      pid: process.pid,
      timestamp: new Date().toISOString(),
    };
  }
}
