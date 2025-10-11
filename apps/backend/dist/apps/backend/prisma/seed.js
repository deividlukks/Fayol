"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const incomeCategories = [
        {
            name: 'Salário',
            type: 'income',
            icon: '💰',
            color: '#4CAF50',
            isSystem: true,
            subcategories: [
                { name: 'Salário CLT', isSystem: true },
                { name: 'Salário PJ', isSystem: true },
                { name: '13º Salário', isSystem: true },
                { name: 'Férias', isSystem: true },
            ],
        },
        {
            name: 'Freelance',
            type: 'income',
            icon: '💻',
            color: '#2196F3',
            isSystem: true,
            subcategories: [
                { name: 'Projetos', isSystem: true },
                { name: 'Consultoria', isSystem: true },
            ],
        },
        {
            name: 'Investimentos',
            type: 'income',
            icon: '📈',
            color: '#FF9800',
            isSystem: true,
            subcategories: [
                { name: 'Dividendos', isSystem: true },
                { name: 'Juros', isSystem: true },
                { name: 'Aluguel de Imóveis', isSystem: true },
            ],
        },
        {
            name: 'Outros',
            type: 'income',
            icon: '➕',
            color: '#9E9E9E',
            isSystem: true,
            subcategories: [
                { name: 'Presentes', isSystem: true },
                { name: 'Reembolsos', isSystem: true },
                { name: 'Prêmios', isSystem: true },
            ],
        },
    ];
    const expenseCategories = [
        {
            name: 'Alimentação',
            type: 'expense',
            icon: '🍔',
            color: '#F44336',
            isSystem: true,
            subcategories: [
                { name: 'Supermercado', isSystem: true },
                { name: 'Restaurante', isSystem: true },
                { name: 'Lanche', isSystem: true },
                { name: 'Delivery', isSystem: true },
            ],
        },
        {
            name: 'Transporte',
            type: 'expense',
            icon: '🚗',
            color: '#3F51B5',
            isSystem: true,
            subcategories: [
                { name: 'Combustível', isSystem: true },
                { name: 'Uber/Taxi', isSystem: true },
                { name: 'Transporte Público', isSystem: true },
                { name: 'Estacionamento', isSystem: true },
                { name: 'Manutenção', isSystem: true },
            ],
        },
        {
            name: 'Moradia',
            type: 'expense',
            icon: '🏠',
            color: '#795548',
            isSystem: true,
            subcategories: [
                { name: 'Aluguel', isSystem: true },
                { name: 'Condomínio', isSystem: true },
                { name: 'Água', isSystem: true },
                { name: 'Luz', isSystem: true },
                { name: 'Gás', isSystem: true },
                { name: 'Internet', isSystem: true },
                { name: 'IPTU', isSystem: true },
            ],
        },
        {
            name: 'Saúde',
            type: 'expense',
            icon: '🏥',
            color: '#E91E63',
            isSystem: true,
            subcategories: [
                { name: 'Plano de Saúde', isSystem: true },
                { name: 'Farmácia', isSystem: true },
                { name: 'Consultas', isSystem: true },
                { name: 'Exames', isSystem: true },
                { name: 'Academia', isSystem: true },
            ],
        },
        {
            name: 'Educação',
            type: 'expense',
            icon: '📚',
            color: '#9C27B0',
            isSystem: true,
            subcategories: [
                { name: 'Cursos', isSystem: true },
                { name: 'Livros', isSystem: true },
                { name: 'Material Escolar', isSystem: true },
                { name: 'Mensalidade', isSystem: true },
            ],
        },
        {
            name: 'Lazer',
            type: 'expense',
            icon: '🎮',
            color: '#00BCD4',
            isSystem: true,
            subcategories: [
                { name: 'Cinema', isSystem: true },
                { name: 'Streaming', isSystem: true },
                { name: 'Viagens', isSystem: true },
                { name: 'Eventos', isSystem: true },
                { name: 'Hobbies', isSystem: true },
            ],
        },
        {
            name: 'Vestuário',
            type: 'expense',
            icon: '👔',
            color: '#673AB7',
            isSystem: true,
            subcategories: [
                { name: 'Roupas', isSystem: true },
                { name: 'Calçados', isSystem: true },
                { name: 'Acessórios', isSystem: true },
            ],
        },
        {
            name: 'Pets',
            type: 'expense',
            icon: '🐕',
            color: '#8BC34A',
            isSystem: true,
            subcategories: [
                { name: 'Veterinário', isSystem: true },
                { name: 'Ração', isSystem: true },
                { name: 'Banho e Tosa', isSystem: true },
            ],
        },
        {
            name: 'Outros',
            type: 'expense',
            icon: '❓',
            color: '#607D8B',
            isSystem: true,
            subcategories: [
                { name: 'Doações', isSystem: true },
                { name: 'Presentes', isSystem: true },
                { name: 'Taxas', isSystem: true },
                { name: 'Diversos', isSystem: true },
            ],
        },
    ];
    const investmentCategories = [
        {
            name: 'Renda Fixa',
            type: 'investment',
            icon: '🏦',
            color: '#4CAF50',
            isSystem: true,
            subcategories: [
                { name: 'Tesouro Direto', isSystem: true },
                { name: 'CDB', isSystem: true },
                { name: 'LCI/LCA', isSystem: true },
                { name: 'Poupança', isSystem: true },
            ],
        },
        {
            name: 'Renda Variável',
            type: 'investment',
            icon: '📊',
            color: '#2196F3',
            isSystem: true,
            subcategories: [
                { name: 'Ações', isSystem: true },
                { name: 'FIIs', isSystem: true },
                { name: 'ETFs', isSystem: true },
                { name: 'BDRs', isSystem: true },
            ],
        },
        {
            name: 'Criptomoedas',
            type: 'investment',
            icon: '₿',
            color: '#FF9800',
            isSystem: true,
            subcategories: [
                { name: 'Bitcoin', isSystem: true },
                { name: 'Ethereum', isSystem: true },
                { name: 'Outras', isSystem: true },
            ],
        },
        {
            name: 'Previdência',
            type: 'investment',
            icon: '🏛️',
            color: '#9C27B0',
            isSystem: true,
            subcategories: [
                { name: 'PGBL', isSystem: true },
                { name: 'VGBL', isSystem: true },
            ],
        },
    ];
    const allCategories = [...incomeCategories, ...expenseCategories, ...investmentCategories];
    for (const categoryData of allCategories) {
        const { subcategories, ...catData } = categoryData;
        const category = await prisma.category.create({
            data: {
                ...catData,
                userId: null,
            },
        });
        console.log(`✅ Created category: ${category.name}`);
        if (subcategories && subcategories.length > 0) {
            for (const subData of subcategories) {
                const subcategory = await prisma.subcategory.create({
                    data: {
                        ...subData,
                        categoryId: category.id,
                        userId: null,
                    },
                });
                console.log(`   ↳ Created subcategory: ${subcategory.name}`);
            }
        }
    }
    console.log('');
    console.log('🎉 Seeding completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    const categoriesCount = await prisma.category.count();
    const subcategoriesCount = await prisma.subcategory.count();
    console.log(`   - ${categoriesCount} categories created`);
    console.log(`   - ${subcategoriesCount} subcategories created`);
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map