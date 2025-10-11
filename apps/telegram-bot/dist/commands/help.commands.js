"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ajudaCommand = ajudaCommand;
const telegraf_1 = require("telegraf");
async function ajudaCommand(ctx) {
    const message = `
✨ *Fayol - Assistente Financeiro Inteligente*

📱 *Comandos Principais:*

*Navegação:*
/menu - Menu principal interativo
/ajuda - Mostrar esta mensagem

*Autenticação:*
/login - Fazer login (E-mail, Celular ou CPF)
/logout - Sair da conta

*Gerenciamento de Contas:*
/contas - Gerenciar suas contas
   • Listar todas as contas
   • Criar nova conta
   • Editar conta existente
   • Excluir conta

*Transações:*
/addreceita - Adicionar receita
/adddespesa - Adicionar despesa
/cancelar - Cancelar operação atual

*Consultas:*
/saldo - Ver saldo e resumo financeiro
/extrato - Últimas 10 transações
/relatorio - Relatório mensal completo

*Categorias:*
/categorias - Ver todas as categorias

---

💡 *Como usar:*

*1. Login Fácil:*
Faça login com:
• 📧 E-mail
• 📱 Celular
• 🆔 CPF

*2. Gerenciar Contas:*
Use /contas para:
• 🏦 Conta Corrente
• 💎 Poupança
• 👛 Carteira
• 💳 Cartão de Crédito

*3. Adicionar Transações:*
Use /addreceita ou /adddespesa:
• \`50 Uber para o trabalho\`
• \`R$ 120,00 Supermercado\`
• \`3000 Salário\`

O bot automaticamente:
✅ Identifica o valor
✅ Captura a descrição
✅ Sugere categoria com IA
✅ Salva a transação

*4. Consultar Saldo:*
Use /saldo para ver:
• Saldo total consolidado
• Resumo do mês atual
• Saldo por conta

*5. Relatórios:*
Use /relatorio para ver:
• Resumo financeiro mensal
• Taxa de economia
• Gastos por categoria
• Análise detalhada

---

🎯 *Recursos Especiais:*

✨ *Categorização Automática com IA*
O bot reconhece automaticamente:
• "Uber" → Transporte
• "Supermercado" → Alimentação
• "Netflix" → Lazer
• E mais de 50 padrões!

💬 *Interface Intuitiva*
• Botões interativos
• Fluxos conversacionais
• Mensagens elegantes
• Confirmações visuais

📊 *Relatórios Detalhados*
• Saldo em tempo real
• Gastos por categoria
• Comparações mensais
• Taxa de economia

---

🔒 *Segurança:*
• Login seguro com JWT
• Senhas não armazenadas
• Dados protegidos
• Sessões seguras

---

📱 *Dica Rápida:*
Use /menu para acessar todas as funcionalidades através de botões interativos!

💬 *Precisa de ajuda específica?*
Digite sua dúvida ou use os comandos acima.
`;
    await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...telegraf_1.Markup.inlineKeyboard([
            [telegraf_1.Markup.button.callback('📊 Ir para o Menu', 'menu')],
            [telegraf_1.Markup.button.callback('🔐 Fazer Login', 'login')],
        ])
    });
}
//# sourceMappingURL=help.commands.js.map