import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega .env da raiz do monorepo
config({ path: resolve(__dirname, '../.env') });

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados PostgreSQL 18.1...\n');

  try {
    // Configurar adapter do PostgreSQL
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    // Testar conexão
    const result = await prisma.$queryRaw`SELECT version(), current_database(), current_user`;
    console.log('✅ Conexão bem-sucedida!\n');
    console.log('Informações do banco:');
    console.log(result);

    // Contar registros
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();

    console.log('\n📊 Dados no banco:');
    console.log(`  • Usuários: ${userCount}`);
    console.log(`  • Categorias: ${categoryCount}`);

    await prisma.$disconnect();
    await pool.end();

    console.log('\n🎉 Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao conectar:', error);
    process.exit(1);
  }
}

testConnection();
