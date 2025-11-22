import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { APP_CONFIG } from '@fayol/shared-constants';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: `%s | ${APP_CONFIG.NAME}`,
    default: APP_CONFIG.NAME,
  },
  description: 'Gestão Financeira Inteligente e Automatizada',
  icons: {
    icon: '/icon.png', // Certifique-se de adicionar este arquivo em apps/web-app/public/
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}