/**
 * Entry point do WhatsApp Bot
 * Inicializa serviços e gerencia lifecycle
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { WhatsAppService } from './services/whatsapp.service';

// Carrega .env da raiz do monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Validação de variáveis obrigatórias
const requiredEnvVars = ['API_BASE_URL'];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variáveis de ambiente ausentes:');
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  console.error('\n💡 Copie o arquivo .env.example para .env e configure as variáveis.');
  process.exit(1);
}

// Banner de inicialização
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🤖  FAYOL WHATSAPP BOT');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Inicializa o serviço principal
const whatsappService = new WhatsAppService();

// Inicia o bot
whatsappService
  .start()
  .then(() => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅  BOT INICIADO COM SUCESSO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal ao iniciar o bot:', error);
    process.exit(1);
  });

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\n\n📡 Recebido sinal: ${signal}`);
  await whatsappService.stop();
  process.exit(0);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});
