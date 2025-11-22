import { APP_CONFIG } from '@fayol/shared-constants';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            {APP_CONFIG.NAME}
          </h1>
          <p className="text-xl text-slate-600">
            Controle financeiro pessoal com inteligência artificial e integração via Telegram.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          {['Registro via Chat', 'Relatórios Automáticos', 'Gestão de Investimentos'].map(
            (feature) => (
              <div
                key={feature}
                className="flex items-center justify-center gap-2 text-slate-700 bg-white p-4 rounded-lg shadow-sm border border-slate-200"
              >
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="font-medium">{feature}</span>
              </div>
            )
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Acessar Sistema
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/auth/register"
            className="text-slate-600 hover:text-primary font-medium px-6 py-3"
          >
            Criar conta gratuita
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-6 text-slate-400 text-sm">
        © {new Date().getFullYear()} {APP_CONFIG.NAME}. Todos os direitos reservados.
      </footer>
    </main>
  );
}
