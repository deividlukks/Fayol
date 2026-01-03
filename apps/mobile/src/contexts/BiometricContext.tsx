import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import BiometricService, { BiometricType } from '../services/BiometricService';

/**
 * BiometricContext
 *
 * Context global para gerenciar estado de autenticação biométrica
 *
 * Features:
 * - Estado global de disponibilidade de biometria
 * - Estado de habilitação do usuário
 * - Métodos para ativar/desativar
 * - Tipo de biometria disponível
 */

interface BiometricContextData {
  // Estados
  isAvailable: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  biometricType: string;
  biometricTypes: BiometricType | null;

  // Métodos
  checkAvailability: () => Promise<void>;
  enableBiometric: (email: string, password: string) => Promise<boolean>;
  disableBiometric: () => Promise<boolean>;
  authenticate: (promptMessage?: string) => Promise<{ success: boolean; error?: string }>;
  getStoredCredentials: () => Promise<{ email: string; password: string } | null>;
}

const BiometricContext = createContext<BiometricContextData>({} as BiometricContextData);

interface BiometricProviderProps {
  children: ReactNode;
}

export function BiometricProvider({ children }: BiometricProviderProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricType, setBiometricType] = useState('Biometria');
  const [biometricTypes, setBiometricTypes] = useState<BiometricType | null>(null);

  /**
   * Verifica disponibilidade de biometria no device
   */
  const checkAvailability = async () => {
    setIsLoading(true);
    try {
      const available = await BiometricService.isAvailable();
      setIsAvailable(available);

      if (available) {
        const types = await BiometricService.getAvailableTypes();
        setBiometricTypes(types);

        const typeName = await BiometricService.getBiometricTypeName();
        setBiometricType(typeName);

        const enabled = await BiometricService.isBiometricEnabled();
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.error('[BiometricContext] Error checking availability:', error);
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Habilita autenticação biométrica
   */
  const enableBiometric = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await BiometricService.enableBiometric({
        email,
        password,
      });

      if (success) {
        setIsEnabled(true);
      }

      return success;
    } catch (error) {
      console.error('[BiometricContext] Error enabling biometric:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Desabilita autenticação biométrica
   */
  const disableBiometric = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await BiometricService.disableBiometric();

      if (success) {
        setIsEnabled(false);
      }

      return success;
    } catch (error) {
      console.error('[BiometricContext] Error disabling biometric:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Executa autenticação biométrica
   */
  const authenticate = async (promptMessage?: string) => {
    return BiometricService.authenticate(promptMessage);
  };

  /**
   * Obtém credenciais armazenadas (após autenticação)
   */
  const getStoredCredentials = async () => {
    return BiometricService.getStoredCredentials();
  };

  // Verifica disponibilidade ao montar
  useEffect(() => {
    checkAvailability();
  }, []);

  return (
    <BiometricContext.Provider
      value={{
        isAvailable,
        isEnabled,
        isLoading,
        biometricType,
        biometricTypes,
        checkAvailability,
        enableBiometric,
        disableBiometric,
        authenticate,
        getStoredCredentials,
      }}
    >
      {children}
    </BiometricContext.Provider>
  );
}

/**
 * Hook para usar o contexto de biometria
 */
export function useBiometric() {
  const context = useContext(BiometricContext);

  if (!context) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }

  return context;
}

export default BiometricContext;
