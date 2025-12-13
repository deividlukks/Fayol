export enum UserRole {
  // Roles existentes
  ADMIN = 'ADMIN',
  USER = 'USER',
  PREMIUM = 'PREMIUM',
  
  // Novas roles
  SUPER_ADMIN = 'SUPER_ADMIN', // Acesso total irrestrito
  SUPPORT = 'SUPPORT',         // Suporte técnico (visualização de logs/erros)
  ATTENDANCE = 'ATTENDANCE',   // Atendimento (visualização básica de dados de usuário para ajuda)
  TEST_USER = 'TEST_USER',     // Usuário para testes automatizados ou Beta testers
}