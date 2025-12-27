import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';

/**
 * Módulo de Monitoramento
 *
 * Expõe endpoints de métricas.
 * A inicialização das métricas é feita pelo TelemetryModule.
 */
@Module({
  controllers: [MetricsController],
})
export class MonitoringModule {}
