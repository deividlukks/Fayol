import { APP_CONFIG } from '@fayol/shared-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Mail, MessageCircle, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="w-full border-b border-slate-200 py-4 bg-white/80 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="relative h-8 w-8">
              <Image src="/icon.png" alt="Logo" fill className="object-contain" />
            </div>
            {APP_CONFIG.NAME}
          </Link>
        </div>
      </header>

      <main className="pt-32 pb-20 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-6">Fale Conosco</h1>
            <p className="text-lg text-slate-600 mb-8">
              Tem alguma dúvida, sugestão ou precisa de ajuda com sua conta? Nossa equipe está
              pronta para atender você.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">E-mail</h3>
                  <p className="text-slate-600">{APP_CONFIG.SUPPORT_EMAIL}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Chat ao Vivo</h3>
                  <p className="text-slate-600">Disponível no Dashboard para assinantes Premium.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Escritório</h3>
                  <p className="text-slate-600">Uberlândia, MG - Brasil</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <Input placeholder="Seu nome completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <Input type="email" placeholder="seu@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
                <Input placeholder="Como podemos ajudar?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                <textarea
                  className="w-full min-h-[120px] rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descreva sua dúvida..."
                ></textarea>
              </div>
              <Button className="w-full" size="lg">
                Enviar Mensagem
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
