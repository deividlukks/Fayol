import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Criando administrador inicial...\n');

  // Hash da senha
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Criar super admin
  const superAdmin = await prisma.admin.upsert({
    where: { email: 'admin@fayol.com' },
    update: {},
    create: {
      name: 'Super Administrador',
      email: 'admin@fayol.com',
      phone: '34999999999',
      cpf: '12345678900',
      password: hashedPassword,
      role: 'super_admin',
      isActive: true,
    },
  });

  console.log('✅ Super Admin criado:');
  console.log(`   Nome: ${superAdmin.name}`);
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Telefone: ${superAdmin.phone}`);
  console.log(`   CPF: ${superAdmin.cpf}`);
  console.log(`   Role: ${superAdmin.role}`);
  console.log(`   Senha: Admin@123\n`);

  // Criar admin regular
  const regularAdmin = await prisma.admin.upsert({
    where: { email: 'suporte@fayol.com' },
    update: {},
    create: {
      name: 'Administrador de Suporte',
      email: 'suporte@fayol.com',
      phone: '34988888888',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });

  console.log('✅ Admin Regular criado:');
  console.log(`   Nome: ${regularAdmin.name}`);
  console.log(`   Email: ${regularAdmin.email}`);
  console.log(`   Telefone: ${regularAdmin.phone}`);
  console.log(`   Role: ${regularAdmin.role}`);
  console.log(`   Senha: Admin@123\n`);

  console.log('🎉 Seed de administradores concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
