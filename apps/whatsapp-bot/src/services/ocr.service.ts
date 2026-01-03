/**
 * Serviço de OCR (Optical Character Recognition)
 * Usa Tesseract.js para extrair texto de imagens de comprovantes
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  detectedAmount?: number;
  detectedDescription?: string;
}

export class OCRService {
  /**
   * Extrai texto de uma imagem usando Tesseract.js
   */
  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      const result = await Tesseract.recognize(imageBuffer, 'por', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`📄 OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      const confidence = result.data.confidence;

      // Tenta detectar valor e descrição no texto extraído
      const detectedAmount = this.extractAmount(text);
      const detectedDescription = this.extractDescription(text);

      return {
        text,
        confidence,
        detectedAmount,
        detectedDescription,
      };
    } catch (error) {
      console.error('❌ Erro ao fazer OCR:', error);
      throw new Error('Falha ao processar imagem');
    }
  }

  /**
   * Extrai valores monetários do texto
   * Procura por padrões como "R$ 35,50", "35.00", etc.
   */
  private extractAmount(text: string): number | undefined {
    // Padrões comuns de valores monetários
    const patterns = [
      /R\$\s*(\d+[.,]\d{2})/i, // R$ 35,50 ou R$ 35.50
      /(\d+[.,]\d{2})\s*(?:reais)?/i, // 35,50 reais
      /total[:\s]*R?\$?\s*(\d+[.,]\d{2})/i, // Total: R$ 35,50
      /valor[:\s]*R?\$?\s*(\d+[.,]\d{2})/i, // Valor: 35,50
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const valueStr = match[1].replace(',', '.');
        const value = parseFloat(valueStr);
        if (!isNaN(value) && value > 0) {
          return value;
        }
      }
    }

    return undefined;
  }

  /**
   * Tenta extrair descrição relevante do comprovante
   * Procura por estabelecimento, categoria, etc.
   */
  private extractDescription(text: string): string | undefined {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    // Palavras-chave que indicam estabelecimento
    const establishmentKeywords = [
      'restaurante',
      'supermercado',
      'farmácia',
      'farmacia',
      'posto',
      'loja',
      'mercado',
      'padaria',
    ];

    // Procura linha com nome do estabelecimento
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      for (const keyword of establishmentKeywords) {
        if (lowerLine.includes(keyword)) {
          return line;
        }
      }
    }

    // Se não encontrar, retorna primeira linha significativa (>3 chars)
    const significantLine = lines.find((l) => l.length > 3 && !/^\d+$/.test(l));
    return significantLine;
  }

  /**
   * Valida se a imagem parece ser um comprovante válido
   */
  async isValidReceipt(imageBuffer: Buffer): Promise<boolean> {
    try {
      const result = await this.extractText(imageBuffer);

      // Considera válido se:
      // 1. Confiança > 60%
      // 2. Detectou algum valor
      // 3. Texto tem mais de 10 caracteres
      return (
        result.confidence > 60 &&
        result.detectedAmount !== undefined &&
        result.text.length > 10
      );
    } catch {
      return false;
    }
  }

  /**
   * Processa comprovante PIX (QR Code ou texto)
   */
  async extractPixInfo(imageBuffer: Buffer): Promise<{
    recipient?: string;
    amount?: number;
    description?: string;
  }> {
    try {
      const result = await this.extractText(imageBuffer);
      const text = result.text;

      // Padrões PIX comuns
      const pixPatterns = {
        recipient: /(?:para|recebedor)[:\s]*(.+)/i,
        amount: /(?:valor|quantia)[:\s]*R?\$?\s*(\d+[.,]\d{2})/i,
        description: /(?:descrição|mensagem)[:\s]*(.+)/i,
      };

      const recipient = text.match(pixPatterns.recipient)?.[1]?.trim();
      const amountStr = text.match(pixPatterns.amount)?.[1]?.replace(',', '.');
      const amount = amountStr ? parseFloat(amountStr) : undefined;
      const description = text.match(pixPatterns.description)?.[1]?.trim();

      return { recipient, amount, description };
    } catch (error) {
      console.error('❌ Erro ao extrair info PIX:', error);
      return {};
    }
  }
}
