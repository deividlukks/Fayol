/**
 * Códigos de status HTTP
 */

export const HTTP_STATUS = {
  // Success 2xx
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection 3xx
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Error 4xx
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Error 5xx
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Mensagens de erro HTTP padrão
 */
export const HTTP_STATUS_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.BAD_REQUEST]: 'Requisição inválida',
  [HTTP_STATUS.UNAUTHORIZED]: 'Não autorizado. Faça login novamente.',
  [HTTP_STATUS.FORBIDDEN]: 'Acesso negado',
  [HTTP_STATUS.NOT_FOUND]: 'Recurso não encontrado',
  [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'Método não permitido',
  [HTTP_STATUS.CONFLICT]: 'Conflito de dados',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Dados inválidos',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'Muitas requisições. Tente novamente em instantes.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'Serviço temporariamente indisponível',
} as const;

/**
 * Verifica se código de status é de sucesso (2xx)
 */
export const isSuccessStatus = (status: number): boolean => {
  return status >= 200 && status < 300;
};

/**
 * Verifica se código de status é de erro do cliente (4xx)
 */
export const isClientError = (status: number): boolean => {
  return status >= 400 && status < 500;
};

/**
 * Verifica se código de status é de erro do servidor (5xx)
 */
export const isServerError = (status: number): boolean => {
  return status >= 500 && status < 600;
};
