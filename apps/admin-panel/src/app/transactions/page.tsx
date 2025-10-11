'use client';

import { Layout } from '@/components/Layout';

export default function TransactionsPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="mt-1 text-sm text-gray-600">
            Visualize e gerencie todas as transações do sistema
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Página em Desenvolvimento
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Esta funcionalidade será implementada em breve.
          </p>
        </div>
      </div>
    </Layout>
  );
}
