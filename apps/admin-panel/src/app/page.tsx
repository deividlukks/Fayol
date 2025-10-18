'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Users,
  Smartphone,
  Brain,
  Lock,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header/Navigation */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Fayol
              </span>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full mb-6">
              <Zap className="w-4 h-4 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-indigo-600">
                Sistema de Gestão Financeira com IA
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              Transforme sua
              <span className="block bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Gestão Financeira
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              O Fayol é uma plataforma completa de gestão financeira pessoal com inteligência artificial,
              disponível em web, mobile e integrada com WhatsApp e Telegram.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={() => router.push('/login')}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#planos"
                className="px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 font-semibold rounded-lg transition-all border-2 border-indigo-600"
              >
                Ver Planos
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que escolher o Fayol?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Uma solução completa que combina tecnologia de ponta com simplicidade
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'Inteligência Artificial',
                description: 'Análises inteligentes e insights personalizados sobre suas finanças com IA avançada.'
              },
              {
                icon: Smartphone,
                title: 'Multiplataforma',
                description: 'Acesse de qualquer lugar: web, mobile (iOS/Android), WhatsApp ou Telegram.'
              },
              {
                icon: BarChart3,
                title: 'Relatórios Detalhados',
                description: 'Visualize suas finanças com gráficos e relatórios completos e intuitivos.'
              },
              {
                icon: Shield,
                title: 'Segurança Máxima',
                description: 'Seus dados protegidos com criptografia de ponta e backup automático.'
              },
              {
                icon: Zap,
                title: 'Automação Inteligente',
                description: 'Categorização automática de transações e alertas personalizados.'
              },
              {
                icon: Users,
                title: 'Gestão Colaborativa',
                description: 'Compartilhe controles e gerencie finanças familiares ou empresariais.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                O que é o Fayol?
              </h2>
              <p className="text-xl mb-6 text-indigo-100">
                O Fayol é um sistema multiplataforma de gestão financeira pessoal que utiliza
                inteligência artificial para ajudar você a ter controle total sobre suas finanças.
              </p>
              <p className="text-lg text-indigo-100 mb-6">
                Inspirado nos princípios de gestão de Henri Fayol, nosso sistema oferece:
              </p>
              <ul className="space-y-3">
                {[
                  'Controle total de receitas e despesas',
                  'Planejamento financeiro inteligente',
                  'Análises e relatórios automatizados',
                  'Integração com bancos e carteiras digitais',
                  'Suporte via IA em múltiplas plataformas'
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-indigo-200" />
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Lock className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">100% Seguro</h3>
                      <p className="text-indigo-100">Criptografia de ponta a ponta</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Brain className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">IA Avançada</h3>
                      <p className="text-indigo-100">Insights personalizados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Acesso Total</h3>
                      <p className="text-indigo-100">Web, Mobile, WhatsApp, Telegram</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Escolha seu plano
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Planos flexíveis para atender suas necessidades financeiras
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Básico',
                price: 'Grátis',
                description: 'Para quem está começando',
                features: [
                  'Até 50 transações/mês',
                  'Acesso ao app mobile',
                  'Relatórios básicos',
                  'Suporte por e-mail',
                  '1 conta bancária'
                ],
                cta: 'Começar Grátis',
                popular: false
              },
              {
                name: 'Profissional',
                price: 'R$ 29,90',
                period: '/mês',
                description: 'Para gestão completa',
                features: [
                  'Transações ilimitadas',
                  'Todos os apps e bots',
                  'Relatórios avançados com IA',
                  'Suporte prioritário',
                  'Contas ilimitadas',
                  'Categorização automática',
                  'Alertas personalizados'
                ],
                cta: 'Começar Agora',
                popular: true
              },
              {
                name: 'Empresarial',
                price: 'R$ 99,90',
                period: '/mês',
                description: 'Para equipes e empresas',
                features: [
                  'Tudo do Profissional',
                  'Múltiplos usuários',
                  'Gestão colaborativa',
                  'API personalizada',
                  'Suporte 24/7',
                  'Consultoria financeira',
                  'Treinamento da equipe'
                ],
                cta: 'Falar com Vendas',
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                  plan.popular ? 'ring-2 ring-indigo-600 transform scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-sm font-medium rounded-bl-lg">
                    Mais Popular
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-gray-600 text-lg">
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => router.push('/login')}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-6 ${
                      plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.cta}
                  </button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 ${
                          plan.popular ? 'text-indigo-600' : 'text-gray-400'
                        }`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para transformar suas finanças?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Junte-se a milhares de usuários que já estão no controle de suas finanças
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-4 bg-white hover:bg-gray-100 text-indigo-600 font-semibold rounded-lg transition-all transform hover:scale-105 inline-flex items-center gap-2 shadow-xl"
            >
              Começar Gratuitamente
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Fayol</span>
              </div>
              <p className="text-sm">
                Sistema multiplataforma de gestão financeira com inteligência artificial.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#recursos" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 Fayol. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
