import { APP_CONFIG } from '@fayol/shared-constants';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image src="/icon.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {APP_CONFIG.NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/features"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Funcionalidades
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Preços
            </Link>
            <Link
              href="/integrations"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Integrações
            </Link>
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors hidden sm:block"
          >
            Entrar
          </Link>
          <Link href="/auth/register">
            <Button size="sm" className="rounded-full px-6">
              Criar Conta
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
