import * as Sentry from '@sentry/node';
import { Logger } from '@nestjs/common';

const logger = new Logger('Sentry');

/**
 * Configuração do Sentry (Atualizada para v10)
 * Restaura funcionalidades originais: Sanitização e Debug
 * Nota: Profiling removido devido à incompatibilidade entre @sentry/node v10 e @sentry/profiling-node v1
 */
export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('⚠️  SENTRY_DSN não configurado - Error tracking desabilitado');
    return;
  }

  const environment = process.env.NODE_ENV || 'development';
  const release = process.env.npm_package_version || '0.0.1';

  const tracesSampleRate = environment === 'production' ? 0.1 : 1.0;

  try {
    Sentry.init({
      dsn,
      environment,
      release: `fayol-backend@${release}`,
      tracesSampleRate,

      // CORREÇÃO CRÍTICA: Impede conflito com o OpenTelemetry configurado manualmente
      skipOpenTelemetrySetup: true,

      // CORREÇÃO: Sintaxe nova do Sentry v8+ para integrações
      integrations: [
        Sentry.httpIntegration({ breadcrumbs: true }), // Substitui new Sentry.Integrations.Http
        Sentry.expressIntegration(), // Substitui new Sentry.Integrations.Express
      ],

      // Configurações de captura
      beforeSend(event, hint) {
        const url = event.request?.url || '';
        if (url.includes('/health') || url.includes('/metrics')) {
          return null;
        }

        if (hint.originalException) {
          const error = hint.originalException as Error;
          event.extra = {
            ...event.extra,
            errorName: error.name,
            errorMessage: error.message,
          };
        }
        return event;
      },

      // RESTAURADO: Configuração de breadcrumbs (Sanitização de URLs)
      beforeBreadcrumb(breadcrumb, hint) {
        if (breadcrumb.category === 'http') {
          breadcrumb.data = {
            ...breadcrumb.data,
            url: breadcrumb.data?.url?.replace(/\/\d+/g, '/:id'),
          };
        }
        return breadcrumb;
      },

      ignoreErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'RequestAbortedError',
        'AbortError',
      ],

      // RESTAURADO: Configurações de debug e transporte
      debug: environment === 'development',
      maxBreadcrumbs: 50,
      attachStacktrace: true,
      serverName: process.env.HOSTNAME || 'unknown',
    });

    logger.log(`✅ Sentry initialized successfully`);
    logger.log(`   Environment: ${environment}`);
    logger.log(`   Release: fayol-backend@${release}`);
  } catch (error) {
    logger.error('❌ Failed to initialize Sentry', error);
  }
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.withScope((scope) => {
    if (context) scope.setContext('additional', context);
    Sentry.captureException(error);
  });
}

export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.addBreadcrumb({ message, category, level, data, timestamp: Date.now() / 1000 });
}

export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser({ id: user.id, email: user.email, username: user.username });
}

export function clearUser(): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser(null);
}
