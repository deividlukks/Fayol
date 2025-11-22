import { Scenes, Markup } from 'telegraf';
import { ApiService } from '../services/api.service';

const apiService = new ApiService();

// WizardScene: Uma série de passos sequenciais
export const loginWizard = new Scenes.WizardScene(
  'login-wizard', // ID da cena
  
  // PASSO 1: Solicita o ID
  async (ctx: any) => {
    await ctx.reply('👋 Olá! Parece que você não está logado.\n\nPor favor, informe seu **Fayol ID** (E-mail ou Telefone) para continuarmos.', { parse_mode: 'Markdown' });
    return ctx.wizard.next();
  },

  // PASSO 2: Valida ID e Pede Senha
  async (ctx: any) => {
    const identifier = ctx.message.text;
    
    // Salva o ID na sessão da cena para usar depois
    ctx.wizard.state.identifier = identifier;

    await ctx.reply('🔍 Verificando cadastro...');
    const exists = await apiService.checkUser(identifier);

    if (!exists) {
      await ctx.reply(`❌ Não encontrei nenhum usuário com o ID "${identifier}".`);
      await ctx.reply('Deseja tentar novamente ou criar uma conta?', Markup.inlineKeyboard([
        Markup.button.callback('Tentar Novamente', 'retry_login'),
        Markup.button.url('Criar Conta (Web)', 'https://fayol.app/register') // URL fictícia do frontend
      ]));
      return ctx.scene.leave();
    }

    await ctx.reply('✅ Usuário encontrado!\n\nAgora, digite sua **senha**:');
    return ctx.wizard.next();
  },

  // PASSO 3: Valida Senha e Loga
  async (ctx: any) => {
    const password = ctx.message.text;
    const identifier = ctx.wizard.state.identifier;

    await ctx.reply('🔐 Validando credenciais...');
    const result = await apiService.login(identifier, password);

    if (result && result.access_token) {
      // Salva na sessão global do bot
      ctx.session.token = result.access_token;
      ctx.session.user = result.user;
      
      await ctx.reply(`🎉 **Login realizado com sucesso!**\nBem-vindo(a), ${result.user.name}.`, { parse_mode: 'Markdown' });
      await ctx.reply('Dica: Envie gastos rápidos como "Uber 25.90" a qualquer momento.');
      return ctx.scene.leave();
    } else {
      await ctx.reply('🚫 Senha incorreta. Vamos tentar do início?');
      // Opcional: Poderia dar retry apenas na senha, mas por segurança reiniciamos
      return ctx.scene.reenter(); 
    }
  }
);

// Ação do botão "Tentar Novamente"
loginWizard.action('retry_login', (ctx: any) => {
  ctx.answerCbQuery();
  return ctx.scene.reenter();
});