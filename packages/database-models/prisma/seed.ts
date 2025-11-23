import { PrismaClient, UserRole, InvestorProfile, AccountType, LaunchType } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // <--- Alterado aqui

const prisma = new PrismaClient();

// --- DADOS DE CATEGORIAS ---
const defaultCategories = [
  // DESPESAS (EXPENSE)
  {
    name: 'Alimentação',
    type: LaunchType.EXPENSE,
    icon: '🍔',
    color: '#FF6B6B',
    order: 1,
    subcategories: ['Supermercado', 'Restaurante', 'Lanche', 'Delivery', 'Padaria', 'Fast Food'],
  },
  // ... (O restante do array de categorias continua igual, não precisa copiar tudo de novo se não quiser, apenas o import)
  {
    name: 'Transporte',
    type: LaunchType.EXPENSE,
    icon: '🚗',
    color: '#4ECDC4',
    order: 2,
    subcategories: ['Combustível', 'Uber/Taxi', 'Transporte Público', 'Estacionamento', 'Pedágio', 'Manutenção Veículo', 'IPVA', 'Seguro Veículo'],
  },
  {
    name: 'Moradia',
    type: LaunchType.EXPENSE,
    icon: '🏠',
    color: '#95E1D3',
    order: 3,
    subcategories: ['Aluguel', 'Condomínio', 'IPTU', 'Água', 'Luz', 'Gás', 'Internet', 'Telefone', 'Manutenção Casa'],
  },
  {
    name: 'Saúde',
    type: LaunchType.EXPENSE,
    icon: '⚕️',
    color: '#FF6B9D',
    order: 4,
    subcategories: ['Plano de Saúde', 'Consulta Médica', 'Medicamentos', 'Exames', 'Dentista', 'Academia'],
  },
  {
    name: 'Educação',
    type: LaunchType.EXPENSE,
    icon: '📚',
    color: '#C7B3E5',
    order: 5,
    subcategories: ['Mensalidade Escola', 'Curso', 'Livros', 'Material Escolar', 'Faculdade'],
  },
  {
    name: 'Lazer',
    type: LaunchType.EXPENSE,
    icon: '🎉',
    color: '#FFA07A',
    order: 6,
    subcategories: ['Cinema', 'Show/Evento', 'Viagem', 'Streaming', 'Jogos', 'Hobbies'],
  },
  {
    name: 'Investimentos',
    type: LaunchType.EXPENSE,
    icon: '📈',
    color: '#6A4C93',
    order: 12,
    subcategories: ['Aportes', 'Compra de Ativos'],
  },
  {
    name: 'Outros',
    type: LaunchType.EXPENSE,
    icon: '💳',
    color: '#9B9B9B',
    order: 99,
    subcategories: ['Presentes', 'Doações', 'Diversos'],
  },

  // RECEITAS (INCOME)
  {
    name: 'Salário',
    type: LaunchType.INCOME,
    icon: '💰',
    color: '#4CAF50',
    order: 1,
    subcategories: ['Salário Líquido', '13º Salário', 'Férias', 'Bonificação', 'Horas Extras'],
  },
  {
    name: 'Freelance',
    type: LaunchType.INCOME,
    icon: '💼',
    color: '#2196F3',
    order: 2,
    subcategories: ['Projeto', 'Consultoria', 'Trabalho Autônomo'],
  },
  {
    name: 'Investimentos',
    type: LaunchType.INCOME,
    icon: '📊',
    color: '#9C27B0',
    order: 3,
    subcategories: ['Dividendos', 'Rendimentos', 'Lucro Venda', 'Juros'],
  },

  // TRANSFERÊNCIAS (TRANSFER)
  {
    name: 'Mesma Titularidade',
    type: LaunchType.TRANSFER,
    icon: '➡️',
    color: '#A0AEC0',
    order: 1,
    subcategories: ['Pix', 'TED', 'DOC', 'Transferência Interna'],
  },
  {
    name: 'Para Terceiros',
    type: LaunchType.TRANSFER,
    icon: '↗️',
    color: '#718096',
    order: 2,
    subcategories: ['Pix', 'TED', 'DOC', 'Pagamento'],
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. SEED DE USUÁRIOS
  console.log('👤 Criando usuários...');
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
      name: 'User Test',
      email: 'user@test.com',
      phoneNumber: '11999999999',
      role: UserRole.USER,
      investorProfile: InvestorProfile.CONSERVATIVE,
    },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        roles: [u.role],
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

    // Cria conta padrão se não existir
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
      console.log(`   💳 Conta criada para ${u.name}`);
    }
  }

  // 2. SEED DE CATEGORIAS (SISTEMA)
  console.log('WB Criando categorias padrão...');
  
  // Limpa categorias do sistema antigas
  await prisma.category.deleteMany({ where: { isSystemDefault: true } });

  for (const cat of defaultCategories) {
    // Cria a categoria Pai
    const parentCategory = await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isSystemDefault: true,
        userId: null,
      },
    });

    // Cria as subcategorias (Children)
    for (const subName of cat.subcategories) {
      await prisma.category.create({
        data: {
          name: subName,
          type: cat.type,
          isSystemDefault: true,
          parentId: parentCategory.id,
          userId: null,
        },
      });
    }
    console.log(`   ✅ Categoria: ${cat.name} (+ ${cat.subcategories.length} subs)`);
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