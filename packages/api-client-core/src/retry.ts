import { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

export interface RetryConfig {
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: AxiosError) => boolean;
  onRetry?: (retryCount: number, error: AxiosError) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry em erros de rede e erros 5xx
    if (!error.response) return true;
    return error.response.status >= 500 && error.response.status < 600;
  },
  onRetry: () => {},
};

/**
 * Adiciona lógica de retry ao Axios
 */
export function setupRetry(axiosInstance: AxiosInstance, config: RetryConfig = {}) {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retryCount?: number };

      // Inicializa contador de retry
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Verifica se deve fazer retry
      const shouldRetry =
        originalRequest._retryCount < retryConfig.retries &&
        retryConfig.retryCondition(error);

      if (!shouldRetry) {
        return Promise.reject(error);
      }

      // Incrementa contador
      originalRequest._retryCount += 1;

      // Callback de retry
      retryConfig.onRetry(originalRequest._retryCount, error);

      // Aguarda antes de tentar novamente (exponential backoff)
      const delay = retryConfig.retryDelay * Math.pow(2, originalRequest._retryCount - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Tenta novamente
      return axiosInstance(originalRequest);
    }
  );
}
