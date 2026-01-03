'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, Wallet, TrendingUp, CheckCircle, Building2 } from 'lucide-react';
import { AccountType, InvestorProfile } from '@fayol/shared-types';

// --- FUNÇÕES UTILITÁRIAS ---
const formatPhone = (value: string) => {
  if (!value) return '';
  const numbers = value.replace(/\D/g, '');
  const limited = numbers.slice(0, 11);
  return limited.replace(/^(\d{2})/, '($1) ').replace(/(\d{5})(\d)/, '$1-$2');
};

// --- SCHEMAS ---
const step1Schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  phoneNumber: z.string().min(15, 'Telefone inválido. Formato: (99) 99999-9999'),
});

const step2Schema = z.object({
  accountName: z.string().min(3, 'Nome da conta deve ter no mínimo 3 caracteres'),
  accountType: z.nativeEnum(AccountType),
  initialBalance: z.number().min(0, 'Saldo não pode ser negativo'),
});

type Step2Data = z.infer<typeof step2Schema>;

// --- COMPONENTE PRINCIPAL ---
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Lógica de carregamento inicial removida pois ainda não temos a rota /auth/me
  // useEffect(() => { ... }, [router]);

  const advanceStep = async (nextStep: number, dataToUpdateUser: Record<string, unknown> = {}) => {
    setIsLoading(true);
    try {
      await api.patch('/users/onboarding/step', {
        step: nextStep,
        ...dataToUpdateUser,
      });

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.onboardingStep = nextStep;
        if (dataToUpdateUser.name) userObj.name = dataToUpdateUser.name;
        if (dataToUpdateUser.investorProfile)
          userObj.investorProfile = dataToUpdateUser.investorProfile;
        localStorage.setItem('user', JSON.stringify(userObj));
      }

      if (nextStep === 5) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setStep(nextStep);
      }
    } catch (error) {
      console.error('Erro ao avançar etapa:', error);
      alert('Erro ao salvar progresso. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao Fayol!</h1>
          <p className="text-slate-500">Vamos configurar sua conta para o sucesso financeiro.</p>
        </div>

        <Progress value={(step / 4) * 100} className="h-2" />

        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-white rounded-t-xl border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-xl">
              {step === 1 && (
                <>
                  <UserIcon className="w-6 h-6 text-blue-600" /> Dados Pessoais
                </>
              )}
              {step === 2 && (
                <>
                  <Wallet className="w-6 h-6 text-blue-600" /> Criar Conta Principal
                </>
              )}
              {step === 3 && (
                <>
                  <TrendingUp className="w-6 h-6 text-blue-600" /> Perfil de Investidor
                </>
              )}
              {step === 4 && (
                <>
                  <CheckCircle className="w-6 h-6 text-blue-600" /> Conclusão
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            {step === 1 && (
              <Step1Form
                onNext={(data: Record<string, unknown>) => advanceStep(2, data)}
                loading={isLoading}
              />
            )}
            {step === 2 && <Step2Form onNext={() => advanceStep(3)} loading={isLoading} />}
            {step === 3 && (
              <Step3Suitability
                onNext={(profile: string) => advanceStep(4, { investorProfile: profile })}
                loading={isLoading}
              />
            )}
            {step === 4 && <Step4Conclusion onFinish={() => advanceStep(5)} loading={isLoading} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// --- STEP 1: DADOS PESSOAIS ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step1Form({ onNext, loading }: any) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(step1Schema) });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setValue('phoneNumber', formatted, { shouldValidate: true });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    const cleanData = { ...data, phoneNumber: data.phoneNumber.replace(/\D/g, '') };
    onNext(cleanData);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500"
    >
      <Input
        label="Nome Completo"
        id="name"
        placeholder="Como gostaria de ser chamado?"
        {...register('name')}
        error={errors.name?.message as string}
      />
      <Input
        label="Celular (WhatsApp)"
        id="phoneNumber"
        placeholder="(34) 99999-9999"
        {...register('phoneNumber')}
        onChange={handlePhoneChange}
        maxLength={15}
        error={errors.phoneNumber?.message as string}
      />
      <Button type="submit" className="w-full" isLoading={loading}>
        Próximo: Conta Principal
      </Button>
    </form>
  );
}

// --- STEP 2: CRIAÇÃO DE CONTA ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step2Form({ onNext, loading }: any) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      accountName: '',
      accountType: AccountType.CHECKING,
      initialBalance: 0,
    },
  });

  const onSubmit = async (data: Step2Data) => {
    try {
      await api.post('/accounts', {
        name: data.accountName,
        type: data.accountType,
        balance: Number(data.initialBalance),
        currency: 'BRL',
      });
      onNext();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar conta. Tente novamente.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500"
    >
      <p className="text-sm text-slate-600 mb-4">
        Vamos criar sua primeira conta para registrar suas movimentações. Pode ser sua conta
        corrente principal ou sua carteira.
      </p>

      <Input
        label="Nome da Conta"
        id="accountName"
        placeholder="Ex: Nubank, Itaú, Carteira..."
        {...register('accountName')}
        error={errors.accountName?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Tipo de Conta</label>
          <Select
            {...register('accountType')}
            options={[
              { label: 'Conta Corrente', value: AccountType.CHECKING },
              { label: 'Poupança', value: AccountType.SAVINGS },
              { label: 'Dinheiro Físico', value: AccountType.CASH },
              { label: 'Cartão de Crédito', value: AccountType.CREDIT_CARD },
            ]}
          />
        </div>
        <Input
          label="Saldo Atual (R$)"
          id="initialBalance"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('initialBalance', { valueAsNumber: true })}
          error={errors.initialBalance?.message}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={loading}>
        Salvar e Continuar
      </Button>
    </form>
  );
}

// --- STEP 3: SUITABILITY (Análise de Perfil) ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step3Suitability({ onNext, loading }: any) {
  const [quizStep, setQuizStep] = useState(0);
  const [score, setScore] = useState(0);
  const [determinedProfile, setDeterminedProfile] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const questions = [
    {
      question: 'Qual é o seu principal objetivo ao investir?',
      options: [
        { text: 'Preservar meu patrimônio, evitando perdas.', points: 1 },
        {
          text: 'Aumentar meu patrimônio gradualmente, assumindo riscos moderados.',
          points: 3,
        },
        {
          text: 'Multiplicar meu capital, mesmo com alto risco de perdas.',
          points: 5,
        },
      ],
    },
    {
      question: 'Por quanto tempo pretende deixar seu dinheiro investido?',
      options: [
        { text: 'Menos de 1 ano.', points: 1 },
        { text: 'De 1 a 5 anos.', points: 3 },
        { text: 'Mais de 5 anos.', points: 5 },
      ],
    },
    {
      question: 'O que você faria se seus investimentos caíssem 20% em um mês?',
      options: [
        { text: 'Venderia tudo imediatamente para não perder mais.', points: 1 },
        { text: 'Aguardaria uma recuperação sem fazer nada.', points: 3 },
        { text: 'Aproveitaria para investir mais (comprar na baixa).', points: 5 },
      ],
    },
  ];

  const handleAnswer = (points: number) => {
    const newScore = score + points;
    setScore(newScore);

    if (quizStep < questions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      let profile = InvestorProfile.CONSERVATIVE;
      if (newScore >= 6 && newScore <= 10) profile = InvestorProfile.MODERATE;
      if (newScore > 10) profile = InvestorProfile.AGGRESSIVE;
      setDeterminedProfile(profile);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBrokerageSubmit = async (data: any) => {
    try {
      await api.post('/accounts', {
        name: data.brokerageName,
        type: AccountType.INVESTMENT,
        balance: 0,
        currency: 'BRL',
      });
      onNext(determinedProfile);
    } catch (error) {
      console.error(error);
      alert('Erro ao criar conta da corretora.');
    }
  };

  if (!determinedProfile) {
    const currentQ = questions[quizStep];
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Análise de Perfil ({quizStep + 1}/{questions.length})
          </h3>
          <p className="text-slate-600 mt-2">{currentQ.question}</p>
        </div>
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt.points)}
              className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-sm text-slate-500 uppercase tracking-wide">Seu perfil é</p>
        <h2 className="text-3xl font-bold text-blue-700 mt-2">
          {determinedProfile === 'CONSERVATIVE' && 'Conservador 🛡️'}
          {determinedProfile === 'MODERATE' && 'Moderado ⚖️'}
          {determinedProfile === 'AGGRESSIVE' && 'Agressivo 🚀'}
        </h2>
        <p className="text-sm text-slate-600 mt-3 px-4">
          {determinedProfile === 'CONSERVATIVE' &&
            'Você prioriza segurança. A IA do Fayol sugerirá ativos de Renda Fixa e Tesouro Direto.'}
          {determinedProfile === 'MODERATE' &&
            'Você busca equilíbrio. Sugeriremos uma carteira diversificada com FIIs e Renda Fixa.'}
          {determinedProfile === 'AGGRESSIVE' &&
            'Você foca no longo prazo. A IA buscará oportunidades em Ações, Cripto e FIIs.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(handleBrokerageSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Qual sua corretora principal?
          </label>
          <Input
            id="brokerageName"
            placeholder="Ex: XP, Rico, NuInvest, Binance..."
            {...register('brokerageName', { required: true })}
            error={errors.brokerageName ? 'Nome da corretora é obrigatório' : ''}
          />
        </div>
        <Button type="submit" className="w-full" isLoading={loading}>
          Confirmar e Finalizar
        </Button>
      </form>
    </div>
  );
}

// --- STEP 4: CONCLUSÃO ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Step4Conclusion({ onFinish, loading }: any) {
  return (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-center">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
          <CheckCircle className="h-10 w-10" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tudo Pronto!</h2>
        <p className="text-slate-600 mt-2">
          Sua conta foi configurada com sucesso. O sistema gerou orçamentos automáticos baseados no
          seu perfil, que você pode ajustar a qualquer momento no painel.
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-left text-sm text-blue-800 space-y-2">
        <p>
          🚀 <strong>Dica:</strong> Para começar, tente adicionar sua primeira transação clicando em
          &quot;Nova Transação&quot; no Dashboard.
        </p>
      </div>

      <Button
        onClick={onFinish}
        className="w-full bg-green-600 hover:bg-green-700"
        isLoading={loading}
      >
        Ir para o Dashboard
      </Button>
    </div>
  );
}
