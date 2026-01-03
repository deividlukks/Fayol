import { APP_CONFIG } from '@fayol/shared-constants';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b border-white/50 py-4 bg-white/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="relative h-8 w-8">
              <Image src="/icon.png" alt="Logo" fill className="object-contain" />
            </div>
            {APP_CONFIG.NAME}
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Planos transparentes</h1>
          <p className="text-lg text-slate-600">
            Comece de graça e evolua conforme suas necessidades financeiras crescem.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Free Plan */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">Gratuito</h3>
            <div className="mt-4 flex items-baseline text-slate-900">
              <span className="text-5xl font-extrabold tracking-tight">R$0</span>
              <span className="ml-1 text-xl font-semibold text-slate-500">/mês</span>
            </div>
            <p className="mt-5 text-slate-500">
              Perfeito para começar a organizar suas finanças pessoais.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Até 2 contas bancárias',
                'Controle de Receitas e Despesas',
                'Relatórios Mensais Básicos',
                'Acesso Web e Mobile',
                'Categorização Manual',
              ].map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
                  <span className="ml-3 text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/auth/register">
                <Button variant="outline" className="w-full" size="lg">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-bl from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              MAIS POPULAR
            </div>
            <h3 className="text-xl font-semibold text-white">Premium</h3>
            <div className="mt-4 flex items-baseline text-white">
              <span className="text-5xl font-extrabold tracking-tight">R$29</span>
              <span className="ml-1 text-xl font-semibold text-slate-400">/mês</span>
            </div>
            <p className="mt-5 text-slate-400">Para investidores e quem busca automação total.</p>

            <ul className="mt-8 space-y-4">
              {[
                'Contas Ilimitadas',
                'IA de Investimentos e Insights',
                'Bot Telegram/WhatsApp Ilimitado',
                'Sinais de Trading',
                'Gestão de Carteira de Ativos',
                'Suporte Prioritário',
              ].map((feature) => (
                <li key={feature} className="flex items-center">
                  <Check className="flex-shrink-0 w-5 h-5 text-blue-400" />
                  <span className="ml-3 text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/auth/register?plan=premium">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                  Assinar Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
