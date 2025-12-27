import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from '../telemetry/metrics';
import type { Response } from 'express';

/**
 * Controller para expor métricas Prometheus
 *
 * Endpoint: /metrics
 * Formato: Prometheus text format
 */
@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('metrics')
  async metrics(@Res() res: Response) {
    const metrics = await this.metricsService.getMetrics();
    const registry = this.metricsService.getRegistry();

    res.setHeader('Content-Type', registry.contentType);
    res.end(metrics);
  }
}
