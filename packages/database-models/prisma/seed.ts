import { PrismaClient, UserRole, InvestorProfile, AccountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Senha padrão para todos: 12345678
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash('12345678', salt);

  const usersData = [
    {
      name: 'Desenvolvedor',
      email: 'deividlucas@fayol.app',
      phoneNumber: '34999729791',
      role: UserRole.ADMIN,
      investorProfile: InvestorProfile.AGGRESSIVE,
    },
    {
      name: 'Deivid Lucas',
      email: 'deividlucas@yahoo.com',
      phoneNumber: '34991560547',
      role: UserRole.PREMIUM,
      investorProfile: InvestorProfile.MODERATE,
    },
    {
      name: 'User Test',
      email: 'beta.test@fayol.app',
      phoneNumber: '34123456789',
      role: UserRole.USER,
      investorProfile: InvestorProfile.CONSERVATIVE,
    },
  ];

  for (const u of usersData) {
    // Upsert: Cria se não existir, atualiza se existir
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phoneNumber: u.phoneNumber,
        passwordHash, // Atualiza a senha para garantir que o hash está correto
        roles: [u.role],
        investorProfile: u.investorProfile,
      },
      create: {
        name: u.name,
        email: u.email,
        phoneNumber: u.phoneNumber,
        passwordHash,
        roles: [u.role],
        investorProfile: u.investorProfile,
        isActive: true,
      },
    });

    // Cria uma conta padrão para o usuário se não tiver
    const accountCount = await prisma.account.count({ where: { userId: user.id } });
    if (accountCount === 0) {
      await prisma.account.create({
        data: {
          userId: user.id,
          name: 'Conta Principal',
          type: AccountType.CHECKING,
          balance: 0,
          currency: 'BRL',
        },
      });
      console.log(`   Shim: Conta criada para ${u.name}`);
    }

    console.log(`✅ Usuário processado: ${u.name} (${u.role})`);
  }

  console.log('🚀 Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });