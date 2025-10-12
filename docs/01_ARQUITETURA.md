🏗️ Arquitetura do Sistema Fayol
Este documento detalha a arquitetura do monorepo e a interação entre os diferentes serviços.

📂 Estrutura do Monorepo
O projeto utiliza um monorepo gerido por PNPM Workspaces e Turborepo para otimizar os builds e a partilha de código.

/
├── apps/
│   ├── backend/         # API principal (NestJS)
│   ├── admin-panel/     # Painel de controlo (Next.js)
│   ├── ai-service/      # Serviço de IA (Python/FastAPI) - A ser criado
│   ├── mobile-app/      # App móvel (React Native/Expo) - A ser criado
│   └── ...              # Outras aplicações (bots)
│
├── packages/
│   ├── ui-components/   # Componentes React partilhados
│   ├── shared-types/    # Tipos e interfaces TypeScript
│   ├── shared-utils/    # Funções utilitárias (formatters, validators)
│   └── ...              # Outros pacotes partilhados
│
└── docs/                # Documentação do projeto

🌐 Fluxo de Dados
Cliente (Admin Panel, Mobile App, Bots): As interfaces comunicam exclusivamente com o apps/backend via API REST.

Backend:

Orquestra a lógica de negócio.

Autentica e autoriza os utilizadores.

Interage com a base de dados PostgreSQL através do Prisma.

Utiliza o Redis para cache e gestão de sessões.

Quando necessita de processamento de IA, faz chamadas HTTP para o apps/ai-service.

AI Service:

Recebe dados do backend (ex: histórico de transações).

Executa modelos de Machine Learning para processar os dados.

Retorna resultados estruturados (ex: categoria sugerida, previsão de gastos) para o backend.

🐳 Containerização
Todos os serviços são projetados para serem executados em contentores Docker, orquestrados pelo docker-compose.yml na raiz do projeto. Isso garante um ambiente de desenvolvimento e produção consistente.
