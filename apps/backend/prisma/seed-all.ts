import { PrismaClient } from '@prisma/client';
import { seedCategories, seedAdmin } from './seeds';

const prisma = new PrismaClient();

/**
 * Seed completo do banco de dados
 * 
 * Executa todos os seeds na ordem correta:
 * 1. Categorias e Subcategorias (dados base do sistema)
 * 2. Módulo Administrativo (admin, planos, versão, configurações)
 * 
 * Uso:
 * - Via Prisma CLI: pnpm prisma db seed
 * - Via npm script: pnpm prisma:seed
 * - Diretamente: ts-node prisma/seed-all.ts
 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║              🌱 SEED DO BANCO DE DADOS FAYOL              ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // ============================================
    // 1. SEED DE CATEGORIAS E SUBCATEGORIAS
    // ============================================
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  ETAPA 1/2: Categorias e Subcategorias                 │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');

    await seedCategories(prisma);

    console.log('');
    console.log('✅ Etapa 1 concluída com sucesso!');
    console.log('');

    // ============================================
    // 2. SEED DO MÓDULO ADMINISTRATIVO
    // ============================================
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  ETAPA 2/2: Módulo Administrativo                      │');
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('');

    await seedAdmin(prisma);

    console.log('');
    console.log('✅ Etapa 2 concluída com sucesso!');
    console.log('');

    // ============================================
    // RESUMO FINAL
    // ============================================
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║            🎉 SEED COMPLETO EXECUTADO COM SUCESSO!        ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');

    // Estatísticas finais
    const stats = await getStats(prisma);
    console.log('📊 Estatísticas do Banco de Dados:');
    console.log('');
    console.log(`   📁 Categorias: ${stats.categories}`);
    console.log(`   📋 Subcategorias: ${stats.subcategories}`);
    console.log(`   👑 Admins: ${stats.admins}`);
    console.log(`   💳 Planos: ${stats.plans}`);
    console.log(`   🔄 Versões: ${stats.versions}`);
    console.log(`   ⚙️  Configurações: ${stats.configs}`);
    console.log('');

    // Instruções de acesso
    console.log('📝 Próximos Passos:');
    console.log('');
    console.log('   1. 🚀 Inicie o backend:');
    console.log('      $ cd apps/backend && pnpm dev');
    console.log('');
    console.log('   2. 🌐 Acesse o Admin Panel:');
    console.log('      URL: http://localhost:3001');
    console.log('      Email: admin@fayol.app');
    console.log('      Senha: admin@123');
    console.log('');
    console.log('   3. ⚠️  IMPORTANTE: Altere a senha padrão em produção!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════════════╗');
    console.error('║                                                           ║');
    console.error('║              ❌ ERRO AO EXECUTAR SEED!                     ║');
    console.error('║                                                           ║');
    console.error('╚═══════════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Detalhes do erro:', error);
    console.error('');
    throw error;
  }
}

/**
 * Coleta estatísticas do banco de dados
 */
async function getStats(prisma: PrismaClient) {
  const [categories, subcategories, admins, plans, versions, configs] =
    await Promise.all([
      prisma.category.count(),
      prisma.subcategory.count(),
      prisma.admin.count(),
      prisma.plan.count(),
      prisma.systemVersion.count(),
      prisma.systemConfig.count(),
    ]);

  return {
    categories,
    subcategories,
    admins,
    plans,
    versions,
    configs,
  };
}

// ============================================
// EXECUÇÃO
// ============================================
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
