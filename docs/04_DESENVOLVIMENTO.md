💻 Guia de Desenvolvimento
Este guia estabelece as convenções e o fluxo de trabalho para contribuir com o projeto Fayol.

🌿 Fluxo de Git (Git Flow)
Utilizamos um fluxo de trabalho simplificado baseado em feature branches.

Branch main: Contém o código de produção estável. Ninguém faz push diretamente para a main.

Feature Branches: Para cada nova funcionalidade ou correção, crie uma nova branch a partir da main.

Nome da Branch: feature/<nome-da-feature> ou fix/<nome-do-bug>

Exemplo: feature/user-dashboard

Pull Requests (PRs):

Quando a funcionalidade estiver completa, abra um Pull Request para a main.

O PR deve ter uma descrição clara do que foi feito.

Pelo menos uma revisão de outro membro da equipa é necessária antes do merge.

Todos os testes de CI/CD (GitHub Actions) devem passar.

✍️ Padrão de Commits
Utilizamos o padrão Conventional Commits. Isto ajuda a manter um histórico de commits legível e a automatizar a geração de changelogs.

Formato: <tipo>(<escopo>): <descrição>

feat: Uma nova funcionalidade.

fix: Uma correção de bug.

docs: Alterações na documentação.

style: Alterações de formatação, sem impacto no código.

refactor: Refatoração de código sem alterar a funcionalidade.

test: Adição ou modificação de testes.

chore: Tarefas de manutenção (build, dependências, etc.).

Exemplo:
feat(auth): implementar autenticação de dois fatores (2FA)

Linting e Formatação
O projeto utiliza ESLint para análise estática de código e Prettier para formatação.

Verificar Lint: pnpm lint

Formatar Código: pnpm format

É altamente recomendado configurar o seu editor (VS Code) para formatar e corrigir erros de lint ao salvar o ficheiro.
