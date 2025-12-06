import { APP_CONFIG } from '@fayol/shared-constants';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import Image from 'next/image';

export default function StatusPage() {
  const systems = [
    { name: 'API Core', status: 'operational' },
    { name: 'Web Dashboard', status: 'operational' },
    { name: 'Telegram Bot', status: 'operational' },
    { name: 'IA Engine', status: 'operational' },
    { name: 'Relatórios', status: 'operational' },
    { name: 'Integrações Bancárias', status: 'degraded' }, // Exemplo
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b border-slate-200 py-4 bg-white fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="relative h-8 w-8">
              <Image src="/icon.png" alt="Logo" fill className="object-contain" />
            </div>
            {APP_CONFIG.NAME} Status
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 max-w-3xl mx-auto px-4">
        <div className="bg-green-500 text-white p-6 rounded-xl mb-8 text-center">
          <h1 className="text-2xl font-bold">Todos os sistemas operacionais</h1>
          <p className="opacity-90">Última atualização: {new Date().toLocaleTimeString()}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {systems.map((sys, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 border-b border-slate-100 last:border-0"
            >
              <span className="font-medium text-slate-700">{sys.name}</span>
              <div className="flex items-center gap-2">
                {sys.status === 'operational' && (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Operacional</span>
                  </>
                )}
                {sys.status === 'degraded' && (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <span className="text-sm text-amber-600 font-medium">Lentidão</span>
                  </>
                )}
                {sys.status === 'down' && (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-600 font-medium">Fora do Ar</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
