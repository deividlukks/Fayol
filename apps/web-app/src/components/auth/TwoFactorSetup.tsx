'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import {
  Loader2,
  Shield,
  CheckCircle,
  Download,
  Copy,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import Image from 'next/image';

interface SetupStep1FormData {
  password: string;
}

interface SetupStep3FormData {
  code: string;
}

interface SetupResponse {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export function TwoFactorSetup() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm<SetupStep1FormData>();

  const {
    register: registerStep3,
    handleSubmit: handleSubmitStep3,
    formState: { errors: errorsStep3 },
  } = useForm<SetupStep3FormData>();

  // Step 1: Verify password and get QR code
  const onPasswordSubmit = async (data: SetupStep1FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<{ data: SetupResponse }>(
        'http://localhost:3333/api/auth/2fa/setup',
        { password: data.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSetupData(response.data.data);
      setStep(2);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || 'Senha incorreta.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Verify TOTP code
  const onCodeSubmit = async (data: SetupStep3FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3333/api/auth/2fa/verify-setup',
        { code: data.code },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || 'Código inválido.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  const handleCopyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      setCopiedBackupCodes(true);
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    }
  };

  const handleDownloadBackupCodes = () => {
    if (setupData?.backupCodes) {
      const content = `FAYOL - Códigos de Backup 2FA\nGerado em: ${new Date().toLocaleString()}\n\n${setupData.backupCodes.join('\n')}\n\n⚠️ Guarde estes códigos em um local seguro. Cada código pode ser usado apenas uma vez.`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fayol-backup-codes-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const renderContent = () => {
    // Step 1: Password verification
    if (step === 1) {
      return (
        <div className="flex w-full flex-col items-center animate-in fade-in duration-300">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-inner transition-all duration-500 bg-blue-50">
            <Shield className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
          </div>

          <h1 className="mb-2 text-center text-lg font-medium text-slate-700">
            Configurar Autenticação de Dois Fatores
          </h1>
          <p className="mb-8 text-center text-sm text-slate-500">
            Primeiro, confirme sua senha para continuar
          </p>

          <form className="w-full space-y-5" onSubmit={handleSubmitStep1(onPasswordSubmit)}>
            <div className="space-y-2">
              <input
                id="password"
                type="password"
                placeholder="Sua senha atual"
                autoFocus
                className="w-full rounded-lg border-0 bg-slate-100 px-4 py-3.5 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                {...registerStep1('password', { required: 'Senha é obrigatória' })}
              />
              {errorsStep1.password && (
                <p className="mt-2 text-xs text-red-500 text-center">
                  {errorsStep1.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-xs font-medium text-red-600 animate-in zoom-in-95">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg px-4 py-3.5 text-sm font-bold text-white transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed bg-[#2e384d] hover:bg-[#1e2532]"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continuar'}
            </button>
          </form>
        </div>
      );
    }

    // Step 2: QR Code and backup codes
    if (step === 2 && setupData) {
      return (
        <div className="flex w-full flex-col items-center animate-in fade-in duration-300">
          <h1 className="mb-6 text-center text-lg font-medium text-slate-700">
            Escaneie o QR Code
          </h1>

          {/* QR Code */}
          <div className="mb-6 rounded-xl bg-white p-4 shadow-md border border-slate-200">
            <Image
              src={setupData.qrCodeUrl}
              alt="QR Code 2FA"
              width={200}
              height={200}
              className="rounded-lg"
            />
          </div>

          {/* Manual secret */}
          <div className="w-full mb-6 space-y-2">
            <p className="text-xs text-slate-600 text-center">
              Ou insira este código manualmente no seu app:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={setupData.secret}
                readOnly
                className="flex-1 rounded-lg border-0 bg-slate-100 px-3 py-2 text-xs font-mono text-slate-900 text-center"
              />
              <button
                type="button"
                onClick={handleCopySecret}
                className="rounded-lg bg-slate-200 p-2 hover:bg-slate-300 transition-colors"
              >
                {copiedSecret ? (
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Copy className="h-5 w-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Backup codes */}
          <div className="w-full mb-6 space-y-3">
            <div className="flex items-center gap-2 justify-center text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-medium">Códigos de Backup (use apenas uma vez cada)</p>
            </div>

            <div className="rounded-lg bg-slate-100 p-4 grid grid-cols-2 gap-2">
              {setupData.backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-slate-700 bg-white px-2 py-1 rounded text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopyBackupCodes}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-300 transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copiedBackupCodes ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                type="button"
                onClick={handleDownloadBackupCodes}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Baixar
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-bold text-white transition-all hover:shadow-md bg-[#2e384d] hover:bg-[#1e2532]"
          >
            Próximo
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      );
    }

    // Step 3: Verify TOTP code
    if (step === 3) {
      return (
        <div className="flex w-full flex-col items-center animate-in fade-in duration-300">
          <div
            className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-inner transition-all duration-500 ${
              isSuccess ? 'bg-emerald-50 scale-110' : 'bg-blue-50'
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="h-12 w-12 text-emerald-500 animate-bounce" strokeWidth={2} />
            ) : (
              <Shield className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
            )}
          </div>

          <h1 className="mb-2 text-center text-lg font-medium text-slate-700">Verificar Código</h1>
          <p className="mb-8 text-center text-sm text-slate-500">
            Insira o código de 6 dígitos do seu app autenticador
          </p>

          <form className="w-full space-y-5" onSubmit={handleSubmitStep3(onCodeSubmit)}>
            <div className="space-y-2">
              <input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                autoFocus
                disabled={isSuccess}
                className="w-full rounded-lg border-0 bg-slate-100 px-4 py-3.5 text-slate-900 text-center font-mono text-lg tracking-widest placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 disabled:opacity-50"
                {...registerStep3('code', {
                  required: 'Código é obrigatório',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Código deve ter 6 dígitos',
                  },
                })}
              />
              {errorsStep3.code && (
                <p className="mt-2 text-xs text-red-500 text-center">{errorsStep3.code.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-xs font-medium text-red-600 animate-in zoom-in-95">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`flex w-full items-center justify-center rounded-lg px-4 py-3.5 text-sm font-bold text-white transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${
                isSuccess ? 'bg-emerald-500' : 'bg-[#2e384d] hover:bg-[#1e2532]'
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isSuccess ? (
                '2FA Ativado!'
              ) : (
                'Verificar e Ativar'
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isLoading || isSuccess}
              className="w-full text-xs text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              Voltar para o QR Code
            </button>
          </form>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center rounded-xl bg-white p-10 shadow-lg min-h-[500px] justify-center transition-all duration-500">
      {renderContent()}
    </div>
  );
}
