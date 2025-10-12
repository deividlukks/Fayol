🔧 Guia de Instalação
Siga estes passos para configurar e executar o ambiente de desenvolvimento localmente.

📋 Pré-requisitos
Node.js: v20.x ou superior (use nvm se possível)

PNPM: npm install -g pnpm

Docker e Docker Compose

🚀 Passos de Instalação
Clonar o Repositório:

git clone <URL_DO_REPOSITORIO>
cd fayol

Instalar Dependências:
O PNPM irá instalar todas as dependências para todas as aplicações e pacotes no monorepo.

pnpm install

Configurar Variáveis de Ambiente:
Cada aplicação em apps/ possui um ficheiro .env.example. Copie-o para .env e preencha as variáveis necessárias.

# Exemplo para o backend
cd apps/backend
cp .env.example .env
# Edite o ficheiro .env com as suas configurações (chaves de BD, segredos JWT, etc.)

Iniciar a Base de Dados e Outros Serviços:
O Docker Compose irá iniciar o PostgreSQL, Redis e outros serviços definidos no docker-compose.yml.

docker-compose up -d

Executar as Migrações da Base de Dados:
Com a base de dados em execução, aplique o schema do Prisma.

cd apps/backend
pnpm prisma migrate dev

Executar as Seeds (Opcional):
Para popular a base de dados com dados iniciais.

cd apps/backend
pnpm prisma db seed

Iniciar as Aplicações em Modo de Desenvolvimento:
Na raiz do projeto, execute o comando dev do Turborepo para iniciar todas as aplicações.

pnpm dev

O backend, o painel administrativo e os outros serviços estarão agora a ser executados e a observar as alterações nos ficheiros.
