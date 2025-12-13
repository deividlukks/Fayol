import { Module, OnModuleInit } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { collectDefaultMetrics, register } from 'prom-client';

@Module({
  controllers: [MetricsController],
})
export class MonitoringModule implements OnModuleInit {
  private static metricsInitialized = false;

  onModuleInit() {
    // Previne a duplicação de métricas em hot-reload (desenvolvimento)
    if (!MonitoringModule.metricsInitialized) {
      // Limpa registros anteriores para evitar conflitos
      register.clear();

      // Inicia a coleta de métricas padrão
      collectDefaultMetrics({ register });

      MonitoringModule.metricsInitialized = true;
    }
  }
}
