'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
// TODO: Fix enum import issue
// import { ConsentType, ConsentStatus } from '@fayol/shared-types';

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

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
}

const CONSENT_KEY = 'fayol_cookie_consent';

export function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Consentimentos individuais
  const [consents, setConsents] = useState({
    necessary: true, // Sempre true, não pode ser desabilitado
    analytics: false,
    marketing: false,
    profiling: false,
  });

  useEffect(() => {
    // Verifica se já existe consentimento salvo
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (!savedConsent) {
      // Aguarda 1 segundo antes de mostrar o banner
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (accepted: boolean, customConsents?: typeof consents) => {
    const consentData = {
      timestamp: new Date().toISOString(),
      accepted,
      details: accepted
        ? customConsents || consents
        : {
            necessary: true,
            analytics: false,
            marketing: false,
            profiling: false,
          },
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));

    // Se o usuário estiver autenticado, envia para o backend
    if (accepted && typeof window !== 'undefined') {
      sendConsentsToBackend(consentData.details);
    }

    setIsVisible(false);
    accepted ? onAccept?.() : onReject?.();
  };

  const sendConsentsToBackend = async (details: typeof consents) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return; // Não autenticado, só salva localmente

      const consentsToSend = [];

      if (details.necessary) {
        consentsToSend.push({
          type: ConsentType.COOKIES,
          status: ConsentStatus.GRANTED,
          purpose: 'Essential cookies for website functionality',
          legalBasis: 'Legitimate interest',
        });
      }

      if (details.analytics) {
        consentsToSend.push({
          type: ConsentType.ANALYTICS,
          status: ConsentStatus.GRANTED,
          purpose: 'Analytics to improve user experience',
          legalBasis: 'Consent',
        });
      }

      if (details.marketing) {
        consentsToSend.push({
          type: ConsentType.MARKETING,
          status: ConsentStatus.GRANTED,
          purpose: 'Marketing communications',
          legalBasis: 'Consent',
        });
      }

      if (details.profiling) {
        consentsToSend.push({
          type: ConsentType.PROFILING,
          status: ConsentStatus.GRANTED,
          purpose: 'User profiling for personalized experience',
          legalBasis: 'Consent',
        });
      }

      // Envia cada consentimento para o backend
      for (const consent of consentsToSend) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/consents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(consent),
        });
      }
    } catch (error) {
      console.error('Failed to send consents to backend:', error);
    }
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      profiling: true,
    };
    setConsents(allAccepted);
    saveConsent(true, allAccepted);
  };

  const handleRejectAll = () => {
    saveConsent(false);
  };

  const handleSavePreferences = () => {
    saveConsent(true, consents);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4 sm:items-center">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🍪 Cookies e Privacidade
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Respeitamos sua privacidade e estamos em conformidade com a LGPD
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Usamos cookies e tecnologias similares para melhorar sua experiência, personalizar
              conteúdo e analisar nosso tráfego. Você pode escolher quais tipos de cookies aceitar.
            </p>

            {!showDetails ? (
              <button
                onClick={() => setShowDetails(true)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm font-medium"
              >
                Ver detalhes e personalizar →
              </button>
            ) : (
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                {/* Cookies Necessários */}
                <div className="flex items-start space-x-3">
                  <input type="checkbox" checked={consents.necessary} disabled className="mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Cookies Necessários (Obrigatório)
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Essenciais para o funcionamento do site. Incluem autenticação, segurança e
                      preferências básicas.
                    </p>
                  </div>
                </div>

                {/* Cookies de Análise */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={consents.analytics}
                    onChange={(e) => setConsents({ ...consents, analytics: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Cookies de Análise
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nos ajudam a entender como você usa o site para melhorar sua experiência
                      (Google Analytics, etc).
                    </p>
                  </div>
                </div>

                {/* Cookies de Marketing */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={consents.marketing}
                    onChange={(e) => setConsents({ ...consents, marketing: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Cookies de Marketing
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Usados para mostrar anúncios relevantes e medir a eficácia de campanhas
                      publicitárias.
                    </p>
                  </div>
                </div>

                {/* Cookies de Perfil */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={consents.profiling}
                    onChange={(e) => setConsents({ ...consents, profiling: e.target.checked })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Cookies de Personalização
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Permitem personalizar sua experiência com base em seu comportamento e
                      preferências.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={handleAcceptAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Aceitar Todos
            </Button>

            {showDetails && (
              <Button
                onClick={handleSavePreferences}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Salvar Preferências
              </Button>
            )}

            <Button onClick={handleRejectAll} variant="outline" className="flex-1">
              Rejeitar Todos
            </Button>
          </div>

          {/* Links */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <a href="/privacy-policy" className="hover:underline">
              Política de Privacidade
            </a>
            {' · '}
            <a href="/terms" className="hover:underline">
              Termos de Uso
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para verificar consentimento
export function useConsent() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    if (savedConsent) {
      const data = JSON.parse(savedConsent);
      setHasConsent(data.accepted);
    } else {
      setHasConsent(false);
    }
  }, []);

  return hasConsent;
}

// Helper para verificar consentimento de tipo específico
export function checkConsentFor(type: 'analytics' | 'marketing' | 'profiling'): boolean {
  const savedConsent = localStorage.getItem(CONSENT_KEY);
  if (!savedConsent) return false;

  try {
    const data = JSON.parse(savedConsent);
    return data.details?.[type] || false;
  } catch {
    return false;
  }
}
