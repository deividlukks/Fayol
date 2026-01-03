import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import {
  ArrowRight,
  Bot,
  PieChart,
  TrendingUp,
  Smartphone,
  ShieldCheck,
  Zap,
  LayoutDashboard,
  Wallet,
  Bell,
  Search,
  Menu,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="w-4 h-4 fill-blue-700" />
            <span>IA com 93-96% de acurácia • 100% Conforme LGPD</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Suas finanças no <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
              Piloto Automático
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            Controle completo de finanças pessoais e investimentos com <strong>Inteligência Artificial</strong>.
            Lance gastos em <strong>3 segundos pelo Telegram</strong>, acompanhe sua carteira e receba
            <strong> previsões de gastos futuros</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="h-12 px-8 text-base rounded-full shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base rounded-full border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Conhecer Recursos
              </Button>
            </Link>
          </div>

          {/* --- MOCKUP DO DASHBOARD (REALISTA) --- */}
          <div className="mt-20 relative mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-slate-50/50 p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="rounded-xl overflow-hidden bg-white border border-slate-100 aspect-[16/9] md:aspect-[21/10] relative flex flex-col shadow-sm">
              {/* Mockup Header */}
              <div className="h-14 border-b border-slate-100 flex items-center justify-between px-4 md:px-6 bg-white">
                <div className="flex items-center gap-4">
                  <div className="p-2 hover:bg-slate-100 rounded-md cursor-pointer lg:hidden">
                    <Menu className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 w-64">
                    <Search className="w-4 h-4" />
                    <span className="text-xs">Buscar transações...</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Bell className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-700">
                    DL
                  </div>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Mockup Sidebar */}
                <div className="w-64 border-r border-slate-100 bg-slate-50 hidden lg:flex flex-col p-4 gap-1">
                  {['Visão Geral', 'Transações', 'Investimentos', 'Orçamentos', 'Relatórios'].map(
                    (item, idx) => (
                      <div
                        key={item}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-3 cursor-default ${idx === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                      >
                        {idx === 0 ? (
                          <LayoutDashboard className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4 rounded bg-slate-200" />
                        )}
                        {item}
                      </div>
                    )
                  )}
                </div>

                {/* Mockup Content */}
                <div className="flex-1 p-6 bg-white overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900">Visão Geral</h2>
                    <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      📅 Outubro 2023
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 h-full">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Card 1 */}
                      <div className="rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Wallet className="w-12 h-12 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">
                            Saldo Total
                          </p>
                          <p className="text-2xl font-bold text-slate-900 mt-1">R$ 12.450,00</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
                          <ArrowUpRight className="w-3 h-3" /> +12%
                        </div>
                      </div>
                      {/* Card 2 */}
                      <div className="rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between h-28">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">Receitas</p>
                          <p className="text-2xl font-bold text-emerald-600 mt-1">R$ 8.200,00</p>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 w-[70%] h-full rounded-full" />
                        </div>
                      </div>
                      {/* Card 3 */}
                      <div className="rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col justify-between h-28">
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase">Despesas</p>
                          <p className="text-2xl font-bold text-red-600 mt-1">R$ 3.150,00</p>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-red-500 w-[40%] h-full rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
                      {/* Chart Mock */}
                      <div className="flex-1 rounded-xl border border-slate-100 p-5 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-bold text-slate-800">Fluxo de Caixa</h3>
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="flex-1 flex items-end gap-2 sm:gap-4 justify-between px-2">
                          {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 w-full">
                              <div className="w-full bg-blue-50 rounded-t-sm relative h-32 flex items-end group">
                                <div
                                  style={{ height: `${h}%` }}
                                  className="w-full bg-blue-500 rounded-t-sm transition-all group-hover:bg-blue-600 relative"
                                >
                                  {/* Tooltip fake */}
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    R$ {h * 100},00
                                  </div>
                                </div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Dia {i + 10}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Transactions List Mock */}
                      <div className="w-full md:w-80 rounded-xl border border-slate-100 p-0 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                          <h3 className="text-sm font-bold text-slate-800">Últimas Transações</h3>
                        </div>
                        <div className="flex-1 p-2 space-y-1 overflow-hidden">
                          {[
                            {
                              name: 'Spotify Premium',
                              cat: 'Assinaturas',
                              val: '-21,90',
                              type: 'expense',
                            },
                            {
                              name: 'Supermercado',
                              cat: 'Alimentação',
                              val: '-450,00',
                              type: 'expense',
                            },
                            {
                              name: 'Salário Mensal',
                              cat: 'Receita',
                              val: '+5.200,00',
                              type: 'income',
                            },
                            {
                              name: 'Uber Viagem',
                              cat: 'Transporte',
                              val: '-18,50',
                              type: 'expense',
                            },
                          ].map((t, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-500'}`}
                                >
                                  {t.type === 'income' ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">{t.name}</p>
                                  <p className="text-[10px] text-slate-400">{t.cat}</p>
                                </div>
                              </div>
                              <span
                                className={`text-xs font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}
                              >
                                {t.val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute -right-12 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-100 animate-bounce hidden xl:block">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Meta Atingida!</p>
                  <p className="text-sm font-bold text-slate-800">Economia de 20%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Gestão Financeira Completa com IA de Ponta
            </h2>
            <p className="text-slate-600 text-lg">
              Categorização automática, previsão de gastos, detecção de anomalias e gestão de investimentos.
              Tudo em uma plataforma <strong>open source</strong> e <strong>100% conforme LGPD</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Bot}
              title="Categorização Automática (93-96%)"
              description="IA com ensemble de 4 modelos (XGBoost, LightGBM, CatBoost, Naive Bayes) categoriza gastos automaticamente. Quanto mais usa, melhor fica!"
              color="text-blue-600"
              bg="bg-blue-100"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Previsão de Gastos Futuros"
              description="Algoritmos Prophet e ARIMA preveem seus gastos do próximo mês com 88-92% de precisão. Planeje-se com antecedência!"
              color="text-emerald-600"
              bg="bg-emerald-100"
            />
            <FeatureCard
              icon={PieChart}
              title="Gestão de Investimentos"
              description="Acompanhe ações BR/US, FIIs, criptomoedas e renda fixa. Veja rentabilidade real, preço médio e diversificação da carteira."
              color="text-purple-600"
              bg="bg-purple-100"
            />
            <FeatureCard
              icon={Smartphone}
              title="Telegram Bot Inteligente"
              description='Lance gastos em 3 segundos: "Almoço 35". Detecção automática de receita/despesa com 90+ palavras-chave. Relatórios por comando.'
              color="text-amber-600"
              bg="bg-amber-100"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="LGPD 100% Conforme"
              description="Gestão de consentimentos, portabilidade de dados, direito ao esquecimento. 2FA com TOTP. Auditoria completa de ações. Seus dados, suas regras."
              color="text-indigo-600"
              bg="bg-indigo-100"
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Detecção de Anomalias"
              description="IA identifica gastos incomuns, duplicatas e mudanças bruscas de padrão. Receba alertas antes de problemas financeiros."
              color="text-rose-600"
              bg="bg-rose-100"
            />
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Lançamento Rápido pelo Telegram
              </h2>
              <p className="text-slate-600 text-lg mb-8">
                Esqueça planilhas e apps complicados. Com o Fayol Bot, você registra gastos
                em linguagem natural. A IA entende e categoriza tudo automaticamente.
              </p>

              <div className="space-y-6">
                <StepItem
                  number="1"
                  title="Conecte o Bot"
                  text="Adicione @FayolBot no seu Telegram e faça login."
                />
                <StepItem
                  number="2"
                  title="Lance em linguagem natural"
                  text='Digite: "Gastei 50 no mercado", "Pizza 35", "Uber 25", "+3000 salário"'
                />
                <StepItem
                  number="3"
                  title="IA categoriza automaticamente"
                  text="93-96% de acurácia. Detecta tipo (receita/despesa), valor e sugere categoria. Você só confirma!"
                />
              </div>
            </div>

            <div className="relative">
              {/* Mockup de Chat */}
              <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl max-w-sm mx-auto border-8 border-slate-800">
                <div className="bg-slate-800 rounded-t-xl -mx-6 -mt-6 px-4 py-3 mb-4 flex items-center gap-3 border-b border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    F
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Fayol Bot</div>
                    <div className="text-slate-400 text-xs">online agora</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <ChatMessage isUser text="Pizza 35" />
                  <ChatMessage
                    isBot
                    text="✅ Despesa detectada!\n🍕 Alimentação\n💰 R$ 35,00\n\nConfirma?"
                  />
                  <ChatMessage isUser text="Sim" />
                  <ChatMessage
                    isBot
                    text="✓ Registrado!\n📊 Orçamento Alimentação: 72% usado"
                  />
                  <ChatMessage isUser text="/saldo" />
                  <ChatMessage
                    isBot
                    text="💰 Saldo Total: R$ 12.450,00\n\n🏦 Conta Corrente: R$ 3.200,00\n💳 Cartão: R$ -850,00\n📈 Investimentos: R$ 10.100,00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY FAYOL (COMPETITIVE ADVANTAGES) --- */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Por que escolher o Fayol?
            </h2>
            <p className="text-slate-600 text-lg">
              Conheça os diferenciais que tornam o Fayol único no mercado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DifferentialCard
              emoji="🤖"
              title="IA Superior"
              description="93-96% de acurácia vs. ~60% dos concorrentes. Ensemble de 4 modelos de ML."
            />
            <DifferentialCard
              emoji="🔮"
              title="Único com Forecasting"
              description="Prevê gastos futuros com Prophet e ARIMA. Nenhum concorrente oferece isso."
            />
            <DifferentialCard
              emoji="🔓"
              title="100% Open Source"
              description="Código auditável, extensível. Sem vendor lock-in. Self-hosted se quiser."
            />
            <DifferentialCard
              emoji="🇧🇷"
              title="LGPD Completo"
              description="Consentimentos, portabilidade, exclusão garantida. Seus dados, suas regras."
            />
            <DifferentialCard
              emoji="⚡"
              title="Telegram Bot"
              description="Lance gastos em 3 segundos. Detecção inteligente com 90+ palavras-chave."
            />
            <DifferentialCard
              emoji="📊"
              title="Investimentos Completos"
              description="Ações BR/US, FIIs, crypto, renda fixa. P&L automático e diversificação."
            />
          </div>

          <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
                <div className="text-sm text-slate-600">Completude do sistema</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">93-96%</div>
                <div className="text-sm text-slate-600">Acurácia da IA</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">&lt;100ms</div>
                <div className="text-sm text-slate-600">Tempo de resposta</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-amber-600 mb-2">550+</div>
                <div className="text-sm text-slate-600">Testes automatizados</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Transforme sua vida financeira hoje
          </h2>
          <p className="text-blue-50 text-lg mb-10 max-w-2xl mx-auto">
            Junte-se às pessoas que já controlam suas finanças com IA de ponta.
            Comece gratuitamente em menos de 2 minutos.
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 h-14 px-10 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              Criar Conta Gratuita Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-blue-100">
            ✓ Sem cartão de crédito • ✓ Setup em 2 minutos • ✓ Open source
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// --- SUB-COMPONENTES ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FeatureCard({ icon: Icon, title, description, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StepItem({ number, title, text }: any) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-slate-900">{title}</h4>
        <p className="text-slate-600 text-sm mt-1">{text}</p>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChatMessage({ isUser, text }: any) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] p-3 rounded-2xl text-sm leading-snug whitespace-pre-line ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-slate-700 text-slate-200 rounded-tl-none'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DifferentialCard({ emoji, title, description }: any) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
