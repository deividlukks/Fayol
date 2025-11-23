'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '@fayol/shared-types'; // Interface do usuário
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  Shield,
  Mail,
  Phone,
  CreditCard,
  Lock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function SettingsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  // Recupera o ID do usuário do localStorage ao carregar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserId(parsed.id);
    }
  }, []);

  // Busca os dados atualizados do usuário na API
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await api.get(`/users/${userId}`);
      return response.data.data;
    },
    enabled: !!userId, // Só roda se tiver ID
  });

  // Função para abrir cliente de e-mail (Simulação de Ticket)
  const handleOpenSupport = () => {
    const subject = encodeURIComponent(`Alteração de Dados Cadastrais - Usuário: ${user?.name}`);
    const body = encodeURIComponent(
      `Olá equipe de suporte,\n\nGostaria de solicitar a alteração dos meus dados cadastrais.\n\nID do Usuário: ${user?.id}\n\nMotivo:\n`
    );
    window.open(`mailto:suporte@fayol.app?subject=${subject}&body=${body}`, '_blank');
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configurações da Conta</h1>
        <p className="text-sm text-slate-500">
          Gerencie seus dados pessoais e preferências de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda: Perfil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Dados Pessoais */}
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-slate-500" />
                  <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-slate-50 text-slate-500 flex items-center gap-1"
                >
                  <Lock className="h-3 w-3" /> Somente Leitura
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Aviso de Segurança */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 text-sm text-blue-700 mb-6">
                <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Por que não posso editar?</p>
                  <p className="mt-1 text-blue-600/90">
                    Para garantir a segurança da sua conta e a integridade das transações
                    financeiras, dados sensíveis só podem ser alterados mediante verificação de
                    identidade pela nossa equipe.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <UserIcon className="h-4 w-4" /> Nome Completo
                  </div>
                  <Input value={user.name} disabled className="bg-slate-50 text-slate-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CreditCard className="h-4 w-4" /> CPF
                  </div>
                  {/* CPF Mockado pois não existe no banco ainda */}
                  <Input value="***.***.***-**" disabled className="bg-slate-50 text-slate-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Mail className="h-4 w-4" /> E-mail
                  </div>
                  <Input value={user.email} disabled className="bg-slate-50 text-slate-600" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Phone className="h-4 w-4" /> Telefone
                  </div>
                  <Input
                    value={user.phoneNumber || 'Não cadastrado'}
                    disabled
                    className="bg-slate-50 text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleOpenSupport}
                  className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Solicitar Alteração de Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita: Informações Adicionais */}
        <div className="space-y-6">
          {/* Card de Perfil de Investidor */}
          <Card>
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="text-lg">Perfil de Investidor</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mb-3">
                  {user.investorProfile ? user.investorProfile[0] : '?'}
                </div>
                <h3 className="font-semibold text-slate-900">
                  {user.investorProfile === 'UNDEFINED' ? 'Não Definido' : user.investorProfile}
                </h3>
                <p className="text-sm text-slate-500 mt-2 mb-4">
                  Seu perfil determina as sugestões de investimento da IA.
                </p>
                <Button variant="outline" className="w-full" disabled>
                  Refazer Análise (Em breve)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Suporte */}
          <Card className="bg-slate-900 text-white border-none">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Precisa de ajuda?</h3>
              <p className="text-slate-400 text-sm mb-4">
                Nossa equipe de suporte está disponível para ajudar com segurança e dados da conta.
              </p>
              <Button
                className="w-full bg-white text-slate-900 hover:bg-slate-100"
                onClick={handleOpenSupport}
              >
                Abrir Chamado
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
