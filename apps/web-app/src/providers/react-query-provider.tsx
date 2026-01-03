'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  // useState garante que o QueryClient seja criado apenas uma vez por sessão do navegador
  // e não recriado a cada re-renderização do componente
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Dados considerados "frescos" por 1 minuto (evita refetching excessivo)
            staleTime: 60 * 1000,
            // Recarrega dados ao focar na janela (útil se usou o bot do Telegram em paralelo)
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
