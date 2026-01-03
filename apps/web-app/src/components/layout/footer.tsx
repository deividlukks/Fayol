import { APP_CONFIG } from '@fayol/shared-constants';
import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative h-6 w-6 opacity-80">
              <Image src="/icon.png" alt="Logo" fill className="object-contain invert" />
            </div>
            <span className="text-xl font-bold text-white">{APP_CONFIG.NAME}</span>
          </div>
          <p className="text-sm max-w-xs">
            Gestão financeira pessoal impulsionada por Inteligência Artificial. Simples, poderosa e
            integrada ao seu dia a dia.
          </p>
        </div>

        {/* Product Column */}
        <div>
          <h4 className="text-white font-semibold mb-4">Produto</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/features" className="hover:text-white transition-colors">
                Funcionalidades
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-white transition-colors">
                Preços
              </Link>
            </li>
            <li>
              <Link href="/integrations" className="hover:text-white transition-colors">
                Integrações
              </Link>
            </li>
            <li>
              <Link href="/status" className="hover:text-white transition-colors">
                Status do Sistema
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="text-white font-semibold mb-4">Legal & Suporte</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">
                Privacidade
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="hover:text-white transition-colors">
                Termos de Uso
              </Link>
            </li>
            <li>
              <Link href="/legal/lgpd" className="hover:text-white transition-colors">
                LGPD
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">
                Fale Conosco
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-xs">
        © {new Date().getFullYear()} {APP_CONFIG.NAME}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
