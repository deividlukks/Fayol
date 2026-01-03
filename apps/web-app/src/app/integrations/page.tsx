import { ExternalLink } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-20 max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Integrações</h1>
        <p className="text-slate-600 text-lg mb-12">
          Conecte o Fayol às ferramentas e instituições financeiras que você já usa.
        </p>

        <div className="grid gap-8">
          {/* Mensageria */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Mensageria</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <IntegrationCard
                name="Telegram"
                desc="Converse com o bot para lançar gastos e receber alertas."
                status="Ativo"
              />
              <IntegrationCard
                name="WhatsApp"
                desc="Integração oficial via API Business (Em breve)."
                status="Em Breve"
              />
            </div>
          </section>

          {/* Open Finance */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Bancos e Corretoras (Via Open Finance)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <IntegrationCard name="Nubank" status="Beta" />
              <IntegrationCard name="Inter" status="Beta" />
              <IntegrationCard name="XP Investimentos" status="Planejado" />
              <IntegrationCard name="BTG Pactual" status="Planejado" />
              <IntegrationCard name="Binance" status="Planejado" />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function IntegrationCard({ name, desc, status }: { name: string; desc?: string; status: string }) {
  const getStatusColor = (s: string) => {
    if (s === 'Ativo') return 'bg-green-100 text-green-700 border-green-200';
    if (s === 'Beta') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800">{name}</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      {desc && <p className="text-sm text-slate-500 mb-4">{desc}</p>}
      <div className="flex items-center text-blue-600 text-sm font-medium cursor-pointer hover:underline">
        Saiba mais <ExternalLink className="ml-1 w-3 h-3" />
      </div>
    </div>
  );
}
