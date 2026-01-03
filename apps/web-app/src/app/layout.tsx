'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import ReactQueryProvider from '../providers/react-query-provider';
import { AuthProvider } from '@fayol/web-shared';
import { CookieConsent } from '../components/consent/CookieConsent';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
            <CookieConsent />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
