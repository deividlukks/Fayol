import { APP_CONFIG } from '@fayol/shared-constants';
import { Bot, TrendingUp, PieChart, ShieldCheck, Globe, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function FeaturesPage() {
  const features = [
    {
      icon: Bot,
      title: 'IA Generativa Financeira',
      description:
        'Nossa IA não apenas categoriza. Ela analisa seu comportamento, prevê gastos futuros e sugere onde você pode economizar. É como ter um consultor financeiro 24/7.',
    },
    {
      icon: Smartphone,
      title: 'Chatbots Integrados',
      description:
        'Registre gastos enviando áudios, textos ou fotos para nosso bot no Telegram ou WhatsApp. A sincronização é instantânea com seu painel.',
    },
    {
      icon: TrendingUp,
      title: 'Gestão de Investimentos',
      description:
        'Controle ações, FIIs, Criptomoedas e Renda Fixa. Receba alertas de proventos, rebalanceamento de carteira e acompanhe sua rentabilidade real.',
    },
    {
      icon: PieChart,
      title: 'Relatórios Deep-Dive',
      description:
        'Vá além do básico. Analise seu fluxo de caixa, evolução patrimonial e quebra de gastos por categorias e subcategorias com gráficos interativos.',
    },
    {
      icon: Globe,
      title: 'Open Finance Ready',
      description:
        'Conecte suas contas bancárias e cartões de crédito para conciliação automática. Suporte aos principais bancos do Brasil (Em breve).',
    },
    {
      icon: ShieldCheck,
      title: 'Segurança Militar',
      description:
        'Seus dados são criptografados ponta a ponta. Utilizamos os mesmos protocolos de segurança de grandes bancos internacionais.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Simplificado para Páginas Internas */}
      <header className="w-full border-b border-slate-100 py-4 bg-white/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="relative h-8 w-8">
              <Image src="/icon.png" alt="Logo" fill className="object-contain" />
            </div>
            {APP_CONFIG.NAME}
          </Link>
          <Link href="/auth/register">
            <Button size="sm">Começar Agora</Button>
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">O Poder do Fayol</h1>
            <p className="text-xl text-slate-600">
              Descubra como transformamos a gestão financeira complexa em uma experiência simples e
              poderosa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-8 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow group"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-24 bg-blue-600 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-6">
                Pronto para assumir o controle?
              </h2>
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                  Criar Conta Gratuita
                </Button>
              </Link>
            </div>
            {/* Decorative Element */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          </div>
        </div>
      </main>
    </div>
  );
}
