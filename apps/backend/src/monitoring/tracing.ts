// Inicialização simples de OpenTelemetry -> Jaeger (opcional)
export default function initTracing() {
  try {
    const host = process.env.JAEGER_AGENT_HOST;
    if (!host) return;

    // Apenas require dinâmico para evitar erro se dependências não estiverem instaladas
    // Usuário deve instalar: @opentelemetry/sdk-trace-node, @opentelemetry/exporter-jaeger, @opentelemetry/instrumentation
    // Esta função tenta inicializar tracing se variáveis de ambiente estiverem presentes.
    // Não falha se as libs não existirem.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { registerInstrumentations } = require('@opentelemetry/instrumentation');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

    const provider = new NodeTracerProvider();
    const exporter = new JaegerExporter({
      serviceName: process.env.OTEL_SERVICE_NAME || 'fayol-backend',
      host: host,
      port: Number(process.env.JAEGER_AGENT_PORT) || 6832,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();

    registerInstrumentations({
      instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
    });
  } catch (err) {
    // Fail silently - tracing is optional
    // eslint-disable-next-line no-console
    console.warn('Tracing not initialized (missing libs or config)');
  }
}
