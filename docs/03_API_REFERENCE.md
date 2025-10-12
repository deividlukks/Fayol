📖 Referência da API (Backend)
Este documento descreve os principais endpoints da API do backend. A documentação completa e interativa está disponível via Swagger quando a aplicação está em execução.

URL Base do Swagger: http://localhost:3001/api

🔐 Autenticação (/auth)
POST /auth/register: Regista um novo utilizador.

POST /auth/login: Autentica um utilizador e retorna um token JWT.

GET /auth/profile: Retorna o perfil do utilizador autenticado.

👤 Utilizadores (/users)
GET /users/me: Obtém os detalhes do utilizador atual.

PATCH /users/me: Atualiza os detalhes do utilizador atual.

💳 Contas (/accounts)
POST /accounts: Cria uma nova conta financeira.

GET /accounts: Lista todas as contas do utilizador.

GET /accounts/:id: Obtém os detalhes de uma conta específica.

PATCH /accounts/:id: Atualiza uma conta.

DELETE /accounts/:id: Remove uma conta.

💸 Transações (/transactions)
POST /transactions: Regista uma nova transação.

GET /transactions: Lista transações com filtros (data, conta, etc.).

PATCH /transactions/:id: Atualiza uma transação.

DELETE /transactions/:id: Remove uma transação.

🧠 Inteligência Artificial (/ai)
GET /ai/analyze-spending: Retorna uma análise detalhada dos gastos do utilizador num período.

Outros endpoints a serem adicionados para anomalias, previsões, etc.
