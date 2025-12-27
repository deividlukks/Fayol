'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@fayol/validation-schemas';
import { authService } from '@fayol/api-client'; // <--- CORREÇÃO 1: Importar a instância (authService)
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, User, Mail, Lock, Phone, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(data); // <--- CORREÇÃO 2: Usar a instância
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login?registered=true');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Falha ao criar conta. Tente novamente.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-[#edf2f7] font-sans text-slate-600">
        <header className="flex w-full items-center justify-center bg-white py-4 shadow-sm">
          <div className="relative h-10 w-40">
            <Image src="/fayol-id.png" alt="Fayol ID" fill className="object-contain" priority />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center p-4">
          <div className="flex w-full max-w-[500px] flex-col items-center rounded-xl bg-white p-10 shadow-lg">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-12 w-12 text-emerald-500" strokeWidth={2} />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-slate-800">Conta Criada!</h1>
            <p className="mb-6 text-center text-slate-600">
              Sua conta foi criada com sucesso. Redirecionando...
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aguarde...</span>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-xs text-slate-400">
          Copyright © {new Date().getFullYear()} - Fayol. Todos os direitos reservados.
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#edf2f7] font-sans text-slate-600">
      <header className="flex w-full items-center justify-center bg-white py-4 shadow-sm">
        <div className="relative h-10 w-40">
          <Image src="/fayol-id.png" alt="Fayol ID" fill className="object-contain" priority />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="flex w-full max-w-[500px] flex-col items-center rounded-xl bg-white p-10 shadow-lg">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 shadow-inner">
            <User className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-slate-800">Criar Conta</h1>
          <p className="mb-8 text-sm text-slate-500">Preencha os dados para começar</p>

          <form className="w-full space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full rounded-lg border-0 bg-slate-100 py-3.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                  {...register('name')}
                />
              </div>
              {errors.name && <p className="mt-2 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full rounded-lg border-0 bg-slate-100 py-3.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-2 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-700">
                Telefone <span className="text-slate-400">(opcional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border-0 bg-slate-100 py-3.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="mt-2 text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  placeholder="Crie uma senha forte"
                  className="w-full rounded-lg border-0 bg-slate-100 py-3.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita sua senha"
                  className="w-full rounded-lg border-0 bg-slate-100 py-3.5 pl-10 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:bg-white focus:ring-2 focus:ring-slate-800 sm:text-sm"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {error && (
              <div className="animate-in zoom-in-95 rounded-lg bg-red-50 p-3 text-center text-xs font-medium text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg bg-[#2e384d] px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#1e2532] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              Já possui uma conta?{' '}
              <Link href="/auth/login" className="font-bold text-slate-600 hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400">
        Copyright © {new Date().getFullYear()} - Fayol. Todos os direitos reservados.
      </footer>
    </div>
  );
}
