import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed do Admin padrão do sistema
 */
async function seedAdmin() {
  console.log('🔐 Criando administrador padrão...');
  
  const hashedPassword = await bcrypt.hash('admin@123', 12);
  
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@fayol.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@fayol.com',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
    },
  });
  
  console.log(`✅ Admin criado: ${admin.email}`);
  console.log(`   Senha padrão: admin@123`);
  console.log(`   ⚠️  IMPORTANTE: Altere esta senha em produção!`);
}

/**
 * Seed dos Planos padrão do sistema
 */
async function seedPlans() {
  console.log('💳 Criando planos de assinatura...');
  
  const plans = [
    {
      name: 'Free',
      description: 'Plano gratuito para começar a organizar suas finanças',
      price: 0,
      maxAccounts: 3,
      maxTransactions: 100,
      maxCategories: 10,
      hasInvestments: false,
      hasTrading: false,
      hasAI: false,
      hasOpenBanking: false,
      hasPrioritySupport: false,
      aiRequestsPerMonth: 0,
      billingPeriod: 'monthly',
      trialDays: 0,
      isActive: true,
    },
    {
      name: 'Basic',
      description: 'Para quem quer mais controle sobre as finanças',
      price: 9.90,
      maxAccounts: 5,
      maxTransactions: 1000,
      maxCategories: 20,
      hasInvestments: false,
      hasTrading: false,
      hasAI: false,
      hasOpenBanking: false,
      hasPrioritySupport: false,
      aiRequestsPerMonth: 10,
      billingPeriod: 'monthly',
      trialDays: 7,
      isActive: true,
    },
    {
      name: 'Premium',
      description: 'Todos os recursos essenciais para gestão financeira completa',
      price: 29.90,
      maxAccounts: 999,
      maxTransactions: 999999,
      maxCategories: 999,
      hasInvestments: true,
      hasTrading: true,
      hasAI: true,
      hasOpenBanking: true,
      hasPrioritySupport: false,
      aiRequestsPerMonth: 100,
      billingPeriod: 'monthly',
      trialDays: 14,
      isActive: true,
    },
    {
      name: 'Enterprise',
      description: 'Solução completa com suporte prioritário e recursos ilimitados',
      price: 99.90,
      maxAccounts: 999,
      maxTransactions: 999999,
      maxCategories: 999,
      hasInvestments: true,
      hasTrading: true,
      hasAI: true,
      hasOpenBanking: true,
      hasPrioritySupport: true,
      aiRequestsPerMonth: 999,
      billingPeriod: 'monthly',
      trialDays: 30,
      isActive: true,
    },
  ];
  
  for (const planData of plans) {
    const plan = await prisma.plan.upsert({
      where: { name: planData.name },
      update: planData,
      create: planData,
    });
    
    console.log(`✅ Plano criado: ${plan.name} - R$ ${plan.price.toString()}/mês`);
  }
}

/**
 * Seed da Versão inicial do sistema
 */
async function seedVersion() {
  console.log('🔄 Criando versão inicial do sistema...');
  
  const version = await prisma.systemVersion.upsert({
    where: { version: '1.0.0' },
    update: {},
    create: {
      version: '1.0.0',
      releaseDate: new Date(),
      type: 'major',
      title: 'Lançamento Inicial do Fayol',
      description: 'Primeira versão estável do sistema de gestão financeira Fayol',
      features: {
        items: [
          'Gestão completa de transações financeiras',
          'Categorização inteligente com IA',
          'Dashboard com métricas em tempo real',
          'Relatórios personalizados (diário, mensal, anual)',
          'Sistema de orçamentos e metas',
          'Bot Telegram para lançamentos rápidos',
          'Suporte a contas múltiplas',
          'Transações recorrentes',
          'Exportação de dados em CSV',
        ],
      },
      bugFixes: {
        items: [],
      },
      breaking: {
        items: [],
      },
      isCurrent: true,
      isActive: true,
    },
  });
  
  console.log(`✅ Versão criada: ${version.version} - ${version.title}`);
}

/**
 * Seed de Configurações do Sistema
 */
async function seedSystemConfig() {
  console.log('⚙️  Criando configurações do sistema...');
  
  const configs = [
    {
      key: 'maintenance_mode',
      value: { enabled: false },
      description: 'Modo de manutenção do sistema',
    },
    {
      key: 'allow_registrations',
      value: { enabled: true },
      description: 'Permitir novos cadastros de usuários',
    },
    {
      key: 'default_plan',
      value: { plan: 'Free' },
      description: 'Plano padrão para novos usuários',
    },
    {
      key: 'smtp_settings',
      value: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'noreply@fayol.com',
          pass: 'change-me',
        },
      },
      description: 'Configurações de SMTP para envio de emails',
    },
    {
      key: 'payment_gateways',
      value: {
        stripe: {
          enabled: false,
          publicKey: '',
          secretKey: '',
        },
        pagseguro: {
          enabled: false,
          email: '',
          token: '',
        },
      },
      description: 'Configurações dos gateways de pagamento',
    },
  ];
  
  for (const configData of configs) {
    const config = await prisma.systemConfig.upsert({
      where: { key: configData.key },
      update: { value: configData.value },
      create: configData,
    });
    
    console.log(`✅ Config criada: ${config.key}`);
  }
}

/**
 * Função principal de execução dos seeds
 */
async function main() {
  console.log('🌱 Iniciando seeds do módulo administrativo...\n');
  
  try {
    await seedAdmin();
    console.log('');
    
    await seedPlans();
    console.log('');
    
    await seedVersion();
    console.log('');
    
    await seedSystemConfig();
    console.log('');
    
    console.log('✅ Todos os seeds foram executados com sucesso!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Acesse http://localhost:3001 (admin panel)');
    console.log('   2. Login: admin@fayol.com');
    console.log('   3. Senha: admin@123');
    console.log('   4. ⚠️  Altere a senha padrão!\n');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
