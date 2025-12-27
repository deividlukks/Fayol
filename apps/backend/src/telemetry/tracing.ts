import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_DEPLOYMENT_ENVIRONMENT, SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { Logger } from '@nestjs/common';

const logger = new Logger('Telemetry');

/**
 * Configuração de OpenTelemetry para tracing distribuído
 *
 * Suporta múltiplos exporters:
 * - Console (desenvolvimento)
 * - OTLP (Jaeger, Tempo, etc)
 * - Custom exporters
 */
export class TelemetryService {
  private sdk: NodeSDK;
  private isInitialized = false;

  constructor() {
    const exporters = this.configureExporters();

    this.sdk = new NodeSDK({
      resource: new Resource({
        [SEMRESATTRS_SERVICE_NAME]: process.env.SERVICE_NAME || 'fayol-backend',
        [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '0.0.1',
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),
      spanProcessor: new BatchSpanProcessor(exporters.trace),
      instrumentations: [
        getNodeAutoInstrumentations({
          // Instrumentação automática de HTTP, gRPC, etc
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingRequestHook: (request) => {
              const path = request.url || '';
              return path === '/health' || path === '/metrics';
            },
          },
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          '@opentelemetry/instrumentation-nestjs-core': {
            enabled: true,
          },
        }),
      ],
    });
  }

  /**
   * Configura exporters baseado no ambiente
   */
  private configureExporters() {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // Em desenvolvimento, usa console exporter
    if (isDevelopment || process.env.OTEL_CONSOLE_EXPORTER === 'true') {
      logger.log('📊 Usando Console Exporter (desenvolvimento)');
      return {
        trace: new ConsoleSpanExporter(),
      };
    }

    // Em produção, usa OTLP (OpenTelemetry Protocol)
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';

    logger.log(`📊 Usando OTLP Exporter: ${otlpEndpoint}`);

    return {
      trace: new OTLPTraceExporter({
        url: otlpEndpoint,
        headers: {
          // Headers customizados (ex: autenticação)
          ...(process.env.OTEL_EXPORTER_OTLP_HEADERS ?
            JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) :
            {}
          ),
        },
      }),
    };
  }

  /**
   * Inicializa tracing
   */
  public async start(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('⚠️  Telemetry já foi inicializado');
      return;
    }

    try {
      await this.sdk.start();
      this.isInitialized = true;
      logger.log('✅ OpenTelemetry tracing iniciado com sucesso');

      // Configurar graceful shutdown
      this.setupShutdownHandlers();
    } catch (error) {
      logger.error('❌ Erro ao iniciar OpenTelemetry', error);
      throw error;
    }
  }

  /**
   * Para tracing gracefully
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.sdk.shutdown();
      this.isInitialized = false;
      logger.log('✅ OpenTelemetry desligado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao desligar OpenTelemetry', error);
      throw error;
    }
  }

  /**
   * Configura handlers para shutdown graceful
   */
  private setupShutdownHandlers(): void {
    const shutdownSignals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

    shutdownSignals.forEach((signal) => {
      process.on(signal, async () => {
        logger.log(`🛑 Recebido sinal ${signal}, desligando telemetry...`);

        try {
          await this.shutdown();
          process.exit(0);
        } catch (error) {
          logger.error('❌ Erro durante shutdown', error);
          process.exit(1);
        }
      });
    });
  }

  /**
   * Verifica se tracing está ativo
   */
  public isActive(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let telemetryInstance: TelemetryService;

/**
 * Obtém instância do serviço de telemetria
 */
export function getTelemetryService(): TelemetryService {
  if (!telemetryInstance) {
    telemetryInstance = new TelemetryService();
  }
  return telemetryInstance;
}

/**
 * Helper para iniciar tracing
 * Usar no main.ts antes de inicializar a aplicação
 */
export async function startTracing(): Promise<void> {
  const telemetry = getTelemetryService();
  await telemetry.start();
}

/**
 * Helper para parar tracing
 */
export async function stopTracing(): Promise<void> {
  const telemetry = getTelemetryService();
  await telemetry.shutdown();
}
