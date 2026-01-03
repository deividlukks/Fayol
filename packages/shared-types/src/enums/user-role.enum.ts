export enum UserRole {
  USER = 'USER',                 // Acesso de usuário
  ADMIN = 'ADMIN',               // Acesso específicos de administração e configurações simples da plataforma
  FINANCEIRO = 'FINANCEIRO',     // Acesso ao gerenciamento de finanças (controle de pagamento e recebimento da plataforma)
  SUPORTE = 'SUPORTE',           // Permite que realize configurações específicas ligada ao suporte técnico da plataforma
  SUPER_ADMIN = 'SUPER_ADMIN',   // Acesso e controle total as configurações da plataforma
  TEST = 'TEST',                 // Permite ao membro de equipe acesso a mesma dashboard do enum USER, porém a captação de logs de desempenho e erros ocorre de forma automática sem consentimento
}