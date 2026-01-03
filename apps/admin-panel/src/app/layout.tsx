'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '@/providers/react-query-provider';
import { AuthProvider } from '@fayol/web-shared';
import { AdminRoute } from '@/components/auth/admin-route';
import { AdminLayout } from '@/components/admin-layout';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Fayol Admin Panel</title>
        <meta name="description" content="Painel Administrativo Fayol" />
      </head>
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthProvider>
            <AdminRoute>
              <AdminLayout>{children}</AdminLayout>
            </AdminRoute>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
