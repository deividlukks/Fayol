module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build', // Mudanças no sistema de build ou dependências externas
        'chore', // Outras mudanças que não modificam src ou arquivos de teste
        'ci', // Mudanças em arquivos e scripts de CI
        'docs', // Apenas mudanças na documentação
        'feat', // Uma nova funcionalidade
        'fix', // Correção de bug
        'perf', // Mudança de código que melhora performance
        'refactor', // Mudança de código que não corrige bug nem adiciona funcionalidade
        'revert', // Reverte um commit anterior
        'style', // Mudanças que não afetam o significado do código (espaços, formatação, etc)
        'test', // Adição ou correção de testes
      ],
    ],
    'subject-case': [0], // Permite qualquer case no subject
  },
};
