import { Injectable, Logger } from '@nestjs/common';
import { register, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

/**
 * Serviço de Métricas Prometheus
 *
 * Coleta e expõe métricas para monitoramento:
 * - HTTP requests (total, duração, por rota)
 * - Database queries (duração, por operação)
 * - Business metrics (transações, usuários, etc)
 * - System metrics (memória, CPU, etc)
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // ==================== HTTP METRICS ====================

  /**
   * Total de requisições HTTP
   */
  public readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total de requisições HTTP recebidas',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  /**
   * Duração das requisições HTTP
   */
  public readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
    registers: [register],
  });

  /**
   * Tamanho das requisições HTTP
   */
  public readonly httpRequestSize = new Histogram({
    name: 'http_request_size_bytes',
    help: 'Tamanho das requisições HTTP em bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 500, 1000, 5000, 10000, 50000],
    registers: [register],
  });

  /**
   * Tamanho das respostas HTTP
   */
  public readonly httpResponseSize = new Histogram({
    name: 'http_response_size_bytes',
    help: 'Tamanho das respostas HTTP em bytes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
    registers: [register],
  });

  // ==================== DATABASE METRICS ====================

  /**
   * Duração das queries do banco
   */
  public readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duração das queries do banco de dados',
    labelNames: ['operation', 'model'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register],
  });

  /**
   * Total de queries executadas
   */
  public readonly dbQueriesTotal = new Counter({
    name: 'db_queries_total',
    help: 'Total de queries executadas no banco',
    labelNames: ['operation', 'model', 'status'],
    registers: [register],
  });

  /**
   * Conexões ativas do banco
   */
  public readonly dbConnectionsActive = new Gauge({
    name: 'db_connections_active',
    help: 'Número de conexões ativas no pool do banco',
    registers: [register],
  });

  // ==================== BUSINESS METRICS ====================

  /**
   * Total de transações financeiras criadas
   */
  public readonly transactionsCreated = new Counter({
    name: 'transactions_created_total',
    help: 'Total de transações financeiras criadas',
    labelNames: ['type', 'category'],
    registers: [register],
  });

  /**
   * Valor total das transações
   */
  public readonly transactionsAmount = new Counter({
    name: 'transactions_amount_total',
    help: 'Valor total das transações em reais',
    labelNames: ['type'],
    registers: [register],
  });

  /**
   * Total de usuários cadastrados
   */
  public readonly usersTotal = new Gauge({
    name: 'users_total',
    help: 'Total de usuários cadastrados no sistema',
    labelNames: ['status'],
    registers: [register],
  });

  /**
   * Total de logins
   */
  public readonly loginAttempts = new Counter({
    name: 'login_attempts_total',
    help: 'Total de tentativas de login',
    labelNames: ['status'],
    registers: [register],
  });

  // ==================== AI SERVICE METRICS ====================

  /**
   * Requisições ao serviço de IA
   */
  public readonly aiRequests = new Counter({
    name: 'ai_requests_total',
    help: 'Total de requisições ao serviço de IA',
    labelNames: ['operation', 'status'],
    registers: [register],
  });

  /**
   * Duração das requisições à IA
   */
  public readonly aiRequestDuration = new Histogram({
    name: 'ai_request_duration_seconds',
    help: 'Duração das requisições ao serviço de IA',
    labelNames: ['operation'],
    buckets: [0.5, 1, 2, 5, 10, 15],
    registers: [register],
  });

  /**
   * Categorização automática (acurácia)
   */
  public readonly aiCategorization = new Counter({
    name: 'ai_categorization_total',
    help: 'Total de categorizações automáticas',
    labelNames: ['found'],
    registers: [register],
  });

  // ==================== APPLICATION METRICS ====================

  /**
   * Informações da aplicação
   */
  public readonly appInfo = new Gauge({
    name: 'app_info',
    help: 'Informações da aplicação (version, environment)',
    labelNames: ['version', 'environment', 'nodejs_version'],
    registers: [register],
  });

  /**
   * Uptime da aplicação
   */
  public readonly appUptime = new Gauge({
    name: 'app_uptime_seconds',
    help: 'Tempo de execução da aplicação em segundos',
    registers: [register],
  });

  /**
   * Total de erros não tratados
   */
  public readonly uncaughtErrors = new Counter({
    name: 'uncaught_errors_total',
    help: 'Total de erros não tratados',
    labelNames: ['type'],
    registers: [register],
  });

  constructor() {
    this.initializeMetrics();
  }

  /**
   * Inicializa métricas e coleta métricas padrão
   */
  private initializeMetrics(): void {
    // Coleta métricas padrão do Node.js (CPU, memória, etc)
    collectDefaultMetrics({
      register,
      prefix: 'nodejs_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    // Define informações da aplicação
    this.appInfo.set(
      {
        version: process.env.npm_package_version || '0.0.1',
        environment: process.env.NODE_ENV || 'development',
        nodejs_version: process.version,
      },
      1
    );

    // Atualiza uptime a cada 5 segundos
    setInterval(() => {
      this.appUptime.set(process.uptime());
    }, 5000);

    this.logger.log('✅ Métricas Prometheus inicializadas');
  }

  /**
   * Retorna o registry do Prometheus
   */
  getRegistry() {
    return register;
  }

  /**
   * Retorna métricas no formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Limpa todas as métricas
   */
  clearMetrics(): void {
    register.clear();
    this.logger.warn('⚠️  Métricas limpas');
  }

  /**
   * Helper: Registra uma requisição HTTP
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    responseSize?: number
  ): void {
    this.httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
    this.httpRequestDuration.labels(method, route, statusCode.toString()).observe(duration / 1000); // Convert to seconds

    if (responseSize) {
      this.httpResponseSize.labels(method, route, statusCode.toString()).observe(responseSize);
    }
  }

  /**
   * Helper: Registra query do banco
   */
  recordDbQuery(operation: string, model: string, duration: number, success: boolean): void {
    const status = success ? 'success' : 'error';

    this.dbQueryDuration.labels(operation, model).observe(duration / 1000);
    this.dbQueriesTotal.labels(operation, model, status).inc();
  }

  /**
   * Helper: Registra transação criada
   */
  recordTransaction(type: 'INCOME' | 'EXPENSE', category: string, amount: number): void {
    this.transactionsCreated.labels(type, category).inc();
    this.transactionsAmount.labels(type).inc(amount);
  }

  /**
   * Helper: Registra tentativa de login
   */
  recordLoginAttempt(success: boolean): void {
    const status = success ? 'success' : 'failure';
    this.loginAttempts.labels(status).inc();
  }

  /**
   * Helper: Registra requisição à IA
   */
  recordAiRequest(
    operation: 'categorize' | 'insights' | 'forecast' | 'train',
    duration: number,
    success: boolean
  ): void {
    const status = success ? 'success' : 'error';

    this.aiRequests.labels(operation, status).inc();
    this.aiRequestDuration.labels(operation).observe(duration / 1000);
  }
}
