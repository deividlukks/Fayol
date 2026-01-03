'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, CheckCircle, Key } from 'lucide-react';

interface TwoFactorLoginProps {
  tempToken: string;
  onBack?: () => void;
}

interface CodeFormData {
  code: string;
}

interface BackupCodeFormData {
  backupCode: string;
}

export function TwoFactorLogin({ tempToken, onBack }: TwoFactorLoginProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode },
  } = useForm<CodeFormData>();

  const {
    register: registerBackup,
    handleSubmit: handleSubmitBackup,
    formState: { errors: errorsBackup },
  } = useForm<BackupCodeFormData>();

  // Verify TOTP code
  const onCodeSubmit = async (data: CodeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3333/api/auth/2fa/verify', {
        tempToken,
        code: data.code,
      });

      // Success! Store token and redirect
      setIsSuccess(true);
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || 'Código inválido.';
      setError(msg);
      setIsLoading(false);
    }
  };

  // Verify backup code
  const onBackupCodeSubmit = async (data: BackupCodeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3333/api/auth/2fa/verify-backup', {
        tempToken,
        backupCode: data.backupCode.toUpperCase().replace(/\s/g, ''),
      });

      // Success! Store token and redirect
      setIsSuccess(true);
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || 'Código de backup inválido.';
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleToggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setError(null);
  };

  return (
    <div className="flex w-full flex-col items-center animate-in fade-in duration-300">
      {/* Icon */}
      <div
        className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-inner transition-all duration-500 ${
          isSuccess ? 'bg-emerald-50 scale-110' : useBackupCode ? 'bg-amber-50' : 'bg-blue-50'
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="h-12 w-12 text-emerald-500 animate-bounce" strokeWidth={2} />
        ) : useBackupCode ? (
          <Key className="h-12 w-12 text-amber-600" strokeWidth={1.5} />
        ) : (
          <Shield className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
        )}
      </div>

      {/* Title */}
      <h1 className="mb-2 text-center text-lg font-medium text-slate-700">
        {useBackupCode ? 'Código de Backup' : 'Autenticação de Dois Fatores'}
      </h1>
      <p className="mb-8 text-center text-sm text-slate-500">
        {useBackupCode
          ? 'Insira um dos seus códigos de backup'
          : 'Insira o código de 6 dígitos do seu app autenticador'}
      </p>

      {/* Form - TOTP Code */}
      {!useBackupCode && (
        <form className="w-full space-y-5" onSubmit={handleSubmitCode(onCodeSubmit)}>
          <div className="space-y-2">
            <input
              id="code"
              type="text"
              placeholder="000000"
              maxLength={6}
              autoFocus
              disabled={isSuccess}
              className="w-full rounded-lg border-0 bg-slate-100 px-4 py-3.5 text-slate-900 text-center font-mono text-lg tracking-widest placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 disabled:opacity-50"
              {...registerCode('code', {
                required: 'Código é obrigatório',
                pattern: {
                  value: /^\d{6}$/,
                  message: 'Código deve ter 6 dígitos',
                },
              })}
            />
            {errorsCode.code && (
              <p className="mt-2 text-xs text-red-500 text-center">{errorsCode.code.message}</p>
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
              'Acesso Permitido!'
            ) : (
              'Verificar'
            )}
          </button>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleToggleBackupCode}
              disabled={isLoading || isSuccess}
              className="w-full text-xs text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              Usar código de backup
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading || isSuccess}
                className="w-full text-xs text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </form>
      )}

      {/* Form - Backup Code */}
      {useBackupCode && (
        <form className="w-full space-y-5" onSubmit={handleSubmitBackup(onBackupCodeSubmit)}>
          <div className="space-y-2">
            <input
              id="backupCode"
              type="text"
              placeholder="A1B2C3D4E5"
              maxLength={10}
              autoFocus
              disabled={isSuccess}
              className="w-full rounded-lg border-0 bg-slate-100 px-4 py-3.5 text-slate-900 text-center font-mono text-base tracking-widest placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 disabled:opacity-50 uppercase"
              {...registerBackup('backupCode', {
                required: 'Código de backup é obrigatório',
                minLength: {
                  value: 10,
                  message: 'Código de backup deve ter 10 caracteres',
                },
              })}
            />
            {errorsBackup.backupCode && (
              <p className="mt-2 text-xs text-red-500 text-center">
                {errorsBackup.backupCode.message}
              </p>
            )}
            <p className="text-xs text-amber-600 text-center">
              ⚠️ Este código será invalidado após o uso
            </p>
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
              isSuccess ? 'bg-emerald-500' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSuccess ? (
              'Acesso Permitido!'
            ) : (
              'Verificar Backup Code'
            )}
          </button>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleToggleBackupCode}
              disabled={isLoading || isSuccess}
              className="w-full text-xs text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              Usar código do app autenticador
            </button>

            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={isLoading || isSuccess}
                className="w-full text-xs text-slate-600 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                Voltar ao login
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
