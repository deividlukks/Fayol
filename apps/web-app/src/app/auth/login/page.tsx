'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRole } from '@fayol/shared-types';
import { LoginInput, loginSchema } from '@fayol/validation-schemas';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
// CORREÇÃO: Trocado LockOpen por Unlock, que é mais garantido existir
import { Loader2, User, Lock, Unlock, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

// Componente de Animação de Carregamento Financeiro
const FinancialLoader = () => (
  <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
    <div className="relative flex items-end gap-1 h-16">
      <div className="w-3 bg-blue-500/80 rounded-t-sm animate-[bounce_1s_infinite_0ms] h-8"></div>
      <div className="w-3 bg-blue-600/80 rounded-t-sm animate-[bounce_1s_infinite_200ms] h-12"></div>
      <div className="w-3 bg-emerald-500/80 rounded-t-sm animate-[bounce_1s_infinite_400ms] h-10"></div>
      <div className="w-3 bg-emerald-600/80 rounded-t-sm animate-[bounce_1s_infinite_100ms] h-16"></div>
      <div className="w-3 bg-blue-700/80 rounded-t-sm animate-[bounce_1s_infinite_300ms] h-14"></div>
    </div>
    <p className="text-sm font-medium text-slate-500 animate-pulse">Verificando...</p>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  // PASSO 1: Valida usuário com animação
  const handleCheckUser = async () => {
    const isValid = await trigger('email');
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    const identifier = getValues('email');

    try {
      const response = await axios.post('http://localhost:3333/api/auth/check', {
        identifier,
      });

      const { exists, name, email } = response.data.data || response.data;

      if (exists) {
        setUserData({ name, email });

        // Inicia animação de transição
        setIsAnimating(true);

        // Simula tempo de processamento visual
        setTimeout(() => {
          setIsAnimating(false);
          setStep(2);
          setIsLoading(false); // Libera o botão para a próxima etapa
        }, 2000);
      } else {
        setError('Usuário não encontrado.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão. Tente novamente.');
      setIsLoading(false);
    }
  };

  // PASSO 2: Login final
  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3333/api/auth/login', {
        ...data,
        email: userData?.email || data.email,
      });

      // Sucesso! Ativa o cadeado verde
      setIsUnlocked(true);

      // Armazena dados
      localStorage.setItem('token', response.data.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      // Determina a rota de redirecionamento baseado no role do usuário
      const userRoles = response.data.data.user.roles || [];
      const isAdmin =
        userRoles.includes(UserRole.ADMIN) || userRoles.includes(UserRole.SUPER_ADMIN);
      const redirectPath = isAdmin ? '/admin' : '/dashboard';

      // Aguarda um pouco para o usuário ver o cadeado verde antes de redirecionar
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || 'Senha incorreta.';
      setError(msg);
      setIsLoading(false); // Libera o botão em caso de erro
      setIsUnlocked(false); // Garante que o cadeado volte a ficar vermelho
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
    setValue('password', '');
    setShowPassword(false);
    setIsUnlocked(false);
    setIsLoading(false);
  };

  // Renderização do conteúdo central
  const renderContent = () => {
    if (isAnimating) {
      return <FinancialLoader />;
    }

    return (
      <div className="flex w-full flex-col items-center animate-in fade-in duration-300">
        {/* Ícone Principal (Muda conforme etapa) */}
        <div
          className={`mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-inner transition-all duration-500 
            ${
              step === 1
                ? 'bg-blue-50' // Etapa 1: Fundo Azul Claro
                : isUnlocked
                  ? 'bg-emerald-50 scale-110' // Etapa 2 (Sucesso): Fundo Verde Claro + Zoom
                  : 'bg-red-50' // Etapa 2 (Aguardando): Fundo Vermelho Claro
            }`}
        >
          {step === 1 ? (
            <User className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
          ) : isUnlocked ? (
            // CORREÇÃO: Usando Unlock ao invés de LockOpen
            <Unlock className="h-12 w-12 text-emerald-500 animate-bounce" strokeWidth={2} />
          ) : (
            <Lock className="h-12 w-12 text-red-500" strokeWidth={2} />
          )}
        </div>

        {/* Título Dinâmico */}
        <h1 className="mb-8 text-center text-lg font-medium text-slate-700 w-full">
          {step === 1 ? (
            'Entre com seu Usuário'
          ) : (
            <div className="flex flex-col items-center gap-1 animate-in fade-in w-full">
              {/* Botão de voltar pequeno no topo do nome */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 mb-2 max-w-full">
                <button
                  onClick={handleBack}
                  className="hover:bg-white rounded-full p-0.5 transition-colors"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-500" />
                </button>
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  {userData?.email}
                </span>
              </div>
              <span className="text-xl font-bold text-slate-800 text-center break-words w-full px-2">
                {userData?.name}
              </span>
            </div>
          )}
        </h1>

        <form
          className="w-full space-y-5"
          onSubmit={step === 1 ? (e) => e.preventDefault() : handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            {/* INPUT: Identificação (Passo 1) */}
            <div
              className={step === 2 ? 'hidden' : 'block animate-in fade-in slide-in-from-right-4'}
            >
              <input
                id="email"
                type="text"
                placeholder="E-mail, Telefone ou CPF"
                autoFocus
                className="w-full rounded-lg border-0 bg-slate-100 px-4 py-3.5 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                {...register('email')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCheckUser();
                  }
                }}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-red-500 text-center">{errors.email.message}</p>
              )}
            </div>

            {/* INPUT: Senha (Passo 2) */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  autoFocus
                  disabled={isUnlocked} // Bloqueia input após sucesso
                  className="w-full rounded-lg border-0 bg-slate-100 px-4 py-3.5 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm pr-10 disabled:opacity-50"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>

                {errors.password && (
                  <p className="mt-2 text-xs text-red-500 text-center">{errors.password.message}</p>
                )}

                <div className="mt-3 flex justify-start">
                  <a
                    href="#"
                    className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    Esqueci minha senha
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-center text-xs font-medium text-red-600 animate-in zoom-in-95">
              {error}
            </div>
          )}

          {/* Botão Principal */}
          <button
            type={step === 1 ? 'button' : 'submit'}
            onClick={step === 1 ? handleCheckUser : undefined}
            disabled={isLoading || isUnlocked}
            className={`flex w-full items-center justify-center rounded-lg px-4 py-3.5 text-sm font-bold text-white transition-all hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed
              ${isUnlocked ? 'bg-emerald-500' : 'bg-[#2e384d] hover:bg-[#1e2532]'}
            `}
          >
            {isLoading && !isUnlocked ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isUnlocked ? (
              'Acesso Permitido!'
            ) : step === 1 ? (
              'Prosseguir'
            ) : (
              'Prosseguir'
            )}
          </button>
        </form>

        {/* Link de rodapé (apenas no passo 1) */}
        {step === 1 && (
          <div className="mt-8 text-center px-4">
            <p className="text-xs leading-relaxed text-slate-400">
              Não possui um usuário?{' '}
              <span
                onClick={() => router.push('/auth/register')}
                className="cursor-pointer font-bold text-slate-600 hover:underline"
              >
                Saiba mais
              </span>{' '}
              ou entre em contato com o administrador.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f7] font-sans text-slate-600">
      {/* HEADER */}
      <header className="flex w-full items-center justify-center bg-white py-4 shadow-sm">
        <div className="relative h-10 w-40">
          <Image src="/fayol-id.png" alt="Fayol ID" fill className="object-contain" priority />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full max-w-[400px] flex-col items-center rounded-xl bg-white p-10 shadow-lg min-h-[400px] justify-center transition-all duration-500">
          {renderContent()}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs text-slate-400">
        Copyright © {new Date().getFullYear()} - Fayol Gestão de Negócios. Todos os direitos
        reservados.
      </footer>
    </div>
  );
}
