import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { MetricsService } from './metrics';
import { LoggingInterceptor } from './logging.interceptor';
import { SentryInterceptor } from './sentry.interceptor';
import { startTracing } from './tracing';

/**
 * Módulo Global de Telemetria
 *
 * Centraliza toda a infraestrutura de observabilidade:
 * - OpenTelemetry Tracing (distributed tracing)
 * - Prometheus Metrics (métricas de aplicação)
 * - Structured Logging (logs estruturados)
 * - Sentry Error Tracking (captura de exceções)
 *
 * É marcado como @Global para que os serviços e interceptors
 * estejam disponíveis em todos os módulos sem necessidade de import.
 */
@Global()
@Module({
  providers: [MetricsService, LoggingInterceptor, SentryInterceptor],
  exports: [MetricsService, LoggingInterceptor, SentryInterceptor],
})
export class TelemetryModule implements OnModuleInit {
  private readonly logger = new Logger(TelemetryModule.name);
  private static tracingInitialized = false;

  async onModuleInit() {
    // Previne inicialização duplicada em hot-reload
    if (TelemetryModule.tracingInitialized) {
      this.logger.warn('⚠️  Telemetry already initialized (hot-reload detected)');
      return;
    }

    // Inicializa OpenTelemetry tracing
    try {
      await startTracing();
      TelemetryModule.tracingInitialized = true;
      this.logger.log('✅ Telemetry module initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize telemetry', error);
      // Não interrompe a aplicação se telemetry falhar
    }
  }
}
