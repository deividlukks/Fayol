'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Info, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
// TODO: Fix enum import issue
// import { ConsentType, ConsentStatus, UserConsent } from '@fayol/shared-types';

// Temporary enum definitions until import issue is resolved
enum ConsentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  COOKIES = 'COOKIES',
  DATA_SHARING = 'DATA_SHARING',
  PROFILING = 'PROFILING',
  THIRD_PARTY = 'THIRD_PARTY',
}

enum ConsentStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  WITHDRAWN = 'WITHDRAWN',
  EXPIRED = 'EXPIRED',
}

interface UserConsent {
  id: string;
  userId: string;
  type: ConsentType;
  status: ConsentStatus;
  purpose?: string;
  legalBasis?: string;
  ipAddress?: string;
  userAgent?: string;
  version: string;
  expiresAt?: Date;
  withdrawnAt?: Date;
  grantedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function PrivacyCenter() {
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consents/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConsents(data.consents || []);
      }
    } catch (error) {
      console.error('Failed to load consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleConsent = async (type: ConsentType, currentStatus: ConsentStatus) => {
    try {
      const token = localStorage.getItem('access_token');

      if (currentStatus === ConsentStatus.GRANTED) {
        // Retira o consentimento
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consents/${type}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        // Concede o consentimento
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            status: ConsentStatus.GRANTED,
          }),
        });
      }

      // Recarrega os consents
      await loadConsents();
    } catch (error) {
      console.error('Failed to toggle consent:', error);
    }
  };

  const requestDataExport = async () => {
    try {
      setExportStatus('Processando...');
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/data-export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ format: 'JSON' }),
      });

      if (response.ok) {
        setExportStatus('Exportação solicitada! Você receberá um email quando estiver pronta.');
      } else {
        setExportStatus('Erro ao solicitar exportação.');
      }
    } catch (error) {
      console.error('Failed to request export:', error);
      setExportStatus('Erro ao solicitar exportação.');
    }
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmEmail }),
      });

      if (response.ok) {
        alert('Conta deletada com sucesso. Você será redirecionado...');
        localStorage.clear();
        window.location.href = '/';
      } else {
        const error = await response.json();
        alert(`Erro: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Erro ao deletar conta.');
    }
  };

  const getConsentLabel = (type: ConsentType): string => {
    const labels: Record<ConsentType, string> = {
      [ConsentType.TERMS_OF_SERVICE]: 'Termos de Serviço',
      [ConsentType.PRIVACY_POLICY]: 'Política de Privacidade',
      [ConsentType.MARKETING]: 'Comunicações de Marketing',
      [ConsentType.ANALYTICS]: 'Análise de Uso',
      [ConsentType.COOKIES]: 'Cookies',
      [ConsentType.DATA_SHARING]: 'Compartilhamento de Dados',
      [ConsentType.PROFILING]: 'Personalização',
      [ConsentType.THIRD_PARTY]: 'Serviços de Terceiros',
    };
    return labels[type] || type;
  };

  const getConsentDescription = (type: ConsentType): string => {
    const descriptions: Record<ConsentType, string> = {
      [ConsentType.TERMS_OF_SERVICE]: 'Concordância com os termos de uso do serviço',
      [ConsentType.PRIVACY_POLICY]: 'Concordância com nossa política de privacidade',
      [ConsentType.MARKETING]: 'Receber emails e notificações sobre novidades e promoções',
      [ConsentType.ANALYTICS]: 'Permitir coleta de dados para melhorar o serviço',
      [ConsentType.COOKIES]: 'Uso de cookies não essenciais',
      [ConsentType.DATA_SHARING]: 'Compartilhar seus dados com parceiros selecionados',
      [ConsentType.PROFILING]: 'Usar seus dados para personalizar sua experiência',
      [ConsentType.THIRD_PARTY]: 'Permitir integração com serviços de terceiros',
    };
    return descriptions[type] || '';
  };

  const isRequired = (type: ConsentType): boolean => {
    return type === ConsentType.TERMS_OF_SERVICE || type === ConsentType.PRIVACY_POLICY;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Shield className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Central de Privacidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus dados e consentimentos (LGPD)
          </p>
        </div>
      </div>

      {/* Consentimentos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Seus Consentimentos
        </h2>

        <div className="space-y-4">
          {Object.values(ConsentType).map((type) => {
            const consent = consents.find((c) => c.type === type);
            const isGranted = consent?.status === ConsentStatus.GRANTED;
            const required = isRequired(type);

            return (
              <div
                key={type}
                className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {getConsentLabel(type)}
                    </h3>
                    {required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {getConsentDescription(type)}
                  </p>
                  {consent && (
                    <p className="text-xs text-gray-500 mt-2">
                      Última atualização: {new Date(consent.grantedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <button
                  onClick={() =>
                    !required && toggleConsent(type, consent?.status || ConsentStatus.DENIED)
                  }
                  disabled={required}
                  className={`ml-4 p-2 rounded-full ${
                    isGranted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  } ${required ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'}`}
                >
                  {isGranted ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exportar Dados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start space-x-3">
          <Download className="h-6 w-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Exportar Seus Dados
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Baixe uma cópia de todos os seus dados em formato JSON (LGPD - Portabilidade de Dados)
            </p>
            <Button onClick={requestDataExport} className="mt-4" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Solicitar Exportação
            </Button>
            {exportStatus && <p className="mt-2 text-sm text-blue-600">{exportStatus}</p>}
          </div>
        </div>
      </div>

      {/* Deletar Conta */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-6">
        <div className="flex items-start space-x-3">
          <Trash2 className="h-6 w-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-400">
              Deletar Minha Conta
            </h2>
            <p className="text-red-700 dark:text-red-300 mt-1">
              Esta ação é irreversível! Todos os seus dados serão permanentemente deletados (LGPD -
              Direito ao Esquecimento).
            </p>

            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              >
                Deletar Minha Conta
              </Button>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="bg-white dark:bg-gray-800 p-4 rounded border-2 border-red-300">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Para confirmar, digite seu email:
                  </label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={deleteAccount}
                    disabled={!confirmEmail}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmar Exclusão
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setConfirmEmail('');
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informação LGPD */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">Seus direitos sob a LGPD:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Confirmação da existência de tratamento</li>
              <li>Acesso aos dados</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação</li>
              <li>Portabilidade dos dados</li>
              <li>Revogação do consentimento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
