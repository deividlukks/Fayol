/**
 * Handler de mídia (imagens, áudio, vídeo, documentos)
 * Implementa OCR para comprovantes e Speech-to-Text para áudios
 */

import { IWhatsAppProvider, WhatsAppMessage } from '../providers/IWhatsAppProvider';
import { ISessionService } from '../services/ISessionService';
import { OCRService } from '../services/ocr.service';
import { STTService } from '../services/stt.service';
import { BotApiService } from '../services/bot-api.service';
import { CurrencyUtils } from '@fayol/shared-utils';
import {
  detectTransactionType,
  detectFromPrefix,
  removePrefix,
  getTypeIcon,
  getTypeName,
} from '../utils/transaction-detector';
import type { LaunchType } from '@fayol/shared-types';

export class MediaHandler {
  private ocrService: OCRService;
  private sttService: STTService;
  private apiService: BotApiService;

  constructor(
    private provider: IWhatsAppProvider,
    private sessionService: ISessionService
  ) {
    this.ocrService = new OCRService();
    this.sttService = new STTService();
    this.apiService = new BotApiService();
  }

  async handle(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;

    // Verifica autenticação
    if (!this.sessionService.isAuthenticated(phoneNumber)) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Você precisa fazer login primeiro.\n\nDigite /start para começar.'
      );
      return;
    }

    // Roteamento por tipo de mídia
    switch (message.mediaType) {
      case 'image':
        await this.handleImage(message);
        break;

      case 'audio':
        await this.handleAudio(message);
        break;

      case 'video':
        await this.handleVideo(message);
        break;

      case 'document':
        await this.handleDocument(message);
        break;

      default:
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Tipo de mídia não suportado.'
        );
    }
  }

  /**
   * Processa imagens (OCR para comprovantes)
   */
  private async handleImage(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const token = this.sessionService.getToken(phoneNumber);

    if (!token || !message.mediaBuffer) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Erro ao processar imagem. Tente novamente.'
      );
      return;
    }

    try {
      await this.provider.sendMessage(
        phoneNumber,
        '📸 *Imagem recebida!*\n\n🔍 Processando com OCR...'
      );

      // Executa OCR
      const ocrResult = await this.ocrService.extractText(message.mediaBuffer);

      // Se não detectou valor, apenas mostra o texto extraído
      if (!ocrResult.detectedAmount) {
        await this.provider.sendMessage(
          phoneNumber,
          `📄 *Texto extraído (${Math.round(ocrResult.confidence)}% confiança):*\n\n` +
            `${ocrResult.text.substring(0, 500)}\n\n` +
            `❌ Não consegui detectar um valor monetário.\n\n` +
            `💡 *Dica:* Digite manualmente no formato:\n` +
            `\`Descrição Valor\` (ex: "Almoço 45")`
        );
        return;
      }

      // Detectou valor - prepara para salvar transação
      const description = ocrResult.detectedDescription || message.body || 'Comprovante';
      const amount = ocrResult.detectedAmount;

      // Detecta tipo automaticamente
      const detection = detectTransactionType(description);
      const transactionType = detection.type;
      const launchType: LaunchType = transactionType as LaunchType;

      // Envia confirmação com dados detectados
      const icon = getTypeIcon(transactionType);
      const typeName = getTypeName(transactionType);

      await this.provider.sendMessage(
        phoneNumber,
        `✅ *Dados extraídos (${Math.round(ocrResult.confidence)}% confiança):*\n\n` +
          `📝 Descrição: ${description}\n` +
          `💵 Valor: ${CurrencyUtils.format(amount)}\n` +
          `🔍 Tipo detectado: ${typeName}\n\n` +
          `📨 Deseja salvar esta transação?\n` +
          `Digite *SIM* para confirmar ou *NÃO* para cancelar.`
      );

      // Salva dados temporários na sessão para confirmação posterior
      const session = await Promise.resolve(this.sessionService.getSession(phoneNumber));
      session.sceneData = {
        ...session.sceneData,
        pendingOCRTransaction: {
          description,
          amount,
          type: launchType,
        },
      };
      await Promise.resolve(this.sessionService.setSession(phoneNumber, session));
    } catch (error: any) {
      console.error('❌ Erro ao processar OCR:', error);
      await this.provider.sendMessage(
        phoneNumber,
        `❌ Erro ao processar imagem: ${error.message}\n\n` +
          `💡 *Dica:* Digite manualmente:\n` +
          `\`Descrição Valor\` (ex: "Mercado 150.50")`
      );
    }
  }

  /**
   * Processa áudio (Speech-to-Text com Whisper API)
   */
  private async handleAudio(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from;
    const token = await Promise.resolve(this.sessionService.getToken(phoneNumber));

    if (!token || !message.mediaBuffer) {
      await this.provider.sendMessage(
        phoneNumber,
        '❌ Erro ao processar áudio. Tente novamente.'
      );
      return;
    }

    // Verifica se STT está configurado
    if (!this.sttService.isConfigured()) {
      await this.provider.sendMessage(
        phoneNumber,
        '🎤 *Áudio recebido!*\n\n' +
          '⚠️ Serviço de transcrição não configurado.\n\n' +
          '💡 *Para ativar:*\n' +
          'Configure OPENAI_API_KEY no arquivo .env\n\n' +
          'Por enquanto, digite suas transações:\n' +
          '`Descrição Valor` (ex: "Uber 28.50")'
      );
      return;
    }

    // Valida áudio
    const validation = this.sttService.validateAudio(message.mediaBuffer);
    if (!validation.valid) {
      await this.provider.sendMessage(
        phoneNumber,
        `❌ ${validation.error}\n\n` +
          'Envie um áudio mais curto ou digite manualmente.'
      );
      return;
    }

    try {
      await this.provider.sendMessage(
        phoneNumber,
        '🎤 *Áudio recebido!*\n\n🔊 Transcrevendo...'
      );

      // Transcreve áudio
      const sttResult = await this.sttService.transcribe(message.mediaBuffer);
      const transcribedText = sttResult.text;

      if (!transcribedText || transcribedText.length < 3) {
        await this.provider.sendMessage(
          phoneNumber,
          '❌ Não consegui entender o áudio.\n\n' +
            '💡 Tente falar mais claramente ou digite manualmente:\n' +
            '`Descrição Valor` (ex: "Mercado 235.90")'
        );
        return;
      }

      // Mostra transcrição
      await this.provider.sendMessage(
        phoneNumber,
        `📝 *Transcrição:*\n"${transcribedText}"\n\n🔍 Processando...`
      );

      // Detecta se há prefixo (+/-) para forçar tipo
      let text = transcribedText.trim();
      const prefixType = detectFromPrefix(text);
      if (prefixType) {
        text = removePrefix(text);
      }

      // Extrai valor usando regex
      const numberRegex = /(\d+(?:[.,]\d{1,2})?)/;
      const match = text.match(numberRegex);

      if (!match) {
        await this.provider.sendMessage(
          phoneNumber,
          `❌ Não consegui detectar um valor numérico.\n\n` +
            `💡 Exemplo de comando por áudio:\n` +
            `"Almoço trinta e cinco reais"\n` +
            `"Uber vinte e oito e cinquenta"\n\n` +
            `Ou digite manualmente: \`Descrição Valor\``
        );
        return;
      }

      const valueStr = match[0].replace(',', '.');
      const amount = parseFloat(valueStr);
      const description = text.replace(match[0], '').trim() || 'Transação por áudio';

      // Determina tipo da transação
      let transactionType;
      let detectionMethod: string;

      if (prefixType) {
        transactionType = prefixType;
        detectionMethod = 'manual (prefixo)';
      } else {
        const detection = detectTransactionType(description);
        transactionType = detection.type;
        detectionMethod = detection.matchedKeyword
          ? `automática (palavra-chave: "${detection.matchedKeyword}")`
          : 'padrão (sem palavra-chave encontrada)';
      }

      const launchType: LaunchType = transactionType as LaunchType;

      // Salva transação automaticamente
      await this.apiService.createTransaction(token, description, amount, launchType);

      const icon = getTypeIcon(transactionType);
      const typeName = getTypeName(transactionType);

      await this.provider.sendMessage(
        phoneNumber,
        `${icon} *${typeName} salva com sucesso!*\n\n` +
          `📝 Descrição: ${description}\n` +
          `💵 Valor: ${CurrencyUtils.format(amount)}\n` +
          `🔍 Tipo: ${typeName} (${detectionMethod})\n` +
          `🎤 Via: Áudio (Whisper API)`
      );
    } catch (error: any) {
      console.error('❌ Erro ao processar STT:', error);
      await this.provider.sendMessage(
        phoneNumber,
        `❌ Erro ao transcrever áudio: ${error.message}\n\n` +
          `💡 *Dica:* Digite manualmente:\n` +
          `\`Descrição Valor\` (ex: "Cinema 40")`
      );
    }
  }

  /**
   * Processa vídeos
   */
  private async handleVideo(message: WhatsAppMessage): Promise<void> {
    await this.provider.sendMessage(
      message.from,
      '🎥 Vídeos não são suportados no momento.\n\n' +
        'Use o lançamento rápido para registrar transações:\n' +
        '`Descrição Valor` (ex: "Pizza 65")'
    );
  }

  /**
   * Processa documentos (futuro: análise de PDFs/planilhas)
   */
  private async handleDocument(message: WhatsAppMessage): Promise<void> {
    const fileName = message.mediaFilename || 'documento';

    await this.provider.sendMessage(
      message.from,
      `📄 *Documento recebido:* ${fileName}\n\n` +
        '🚧 A análise de documentos será ativada em breve.\n\n' +
        '💡 *Próximas funcionalidades:*\n' +
        '• Importação de extratos bancários (PDF/OFX)\n' +
        '• Leitura de faturas de cartão\n' +
        '• Análise de planilhas Excel\n\n' +
        'Por enquanto, use /excel para exportar suas transações.'
    );
  }
}
