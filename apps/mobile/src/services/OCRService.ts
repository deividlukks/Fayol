import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

/**
 * OCRService
 *
 * Serviço para OCR (Optical Character Recognition) de recibos
 *
 * Features:
 * - Reconhecimento de texto em imagens
 * - Extração de dados de recibo (valor, data, comerciante)
 * - Suporte a câmera e galeria
 * - Parser inteligente de recibos brasileiros
 */

export interface OCRResult {
  text: string;
  blocks: TextBlock[];
  confidence: number;
}

export interface TextBlock {
  text: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export interface ParsedReceipt {
  amount: number | null;
  merchant: string | null;
  date: Date | null;
  items: ReceiptItem[];
  rawText: string;
  confidence: number;
}

export interface ReceiptItem {
  description: string;
  amount: number;
  quantity?: number;
}

class OCRService {
  private static instance: OCRService;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Request camera permissions
   */
  async requestCameraPermission(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[OCRService] Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('[OCRService] Error requesting media library permission:', error);
      return false;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        console.warn('[OCRService] Camera permission not granted');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Balanced quality for OCR
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('[OCRService] Error taking photo:', error);
      return null;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImage(): Promise<string | null> {
    try {
      const hasPermission = await this.requestMediaLibraryPermission();
      if (!hasPermission) {
        console.warn('[OCRService] Media library permission not granted');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('[OCRService] Error picking image:', error);
      return null;
    }
  }

  /**
   * Recognize text from image using ML Kit
   */
  async recognizeText(imageUri: string): Promise<OCRResult> {
    try {
      console.log('[OCRService] Recognizing text from image:', imageUri);

      const result = await TextRecognition.recognize(imageUri);

      const blocks: TextBlock[] = result.blocks.map((block) => ({
        text: block.text,
        bounds: {
          x: block.frame.x,
          y: block.frame.y,
          width: block.frame.width,
          height: block.frame.height,
        },
        confidence: 1.0, // ML Kit doesn't provide confidence per block
      }));

      const ocrResult: OCRResult = {
        text: result.text,
        blocks,
        confidence: 0.9, // Estimated confidence
      };

      console.log('[OCRService] Text recognized:', ocrResult.text.substring(0, 100));
      return ocrResult;
    } catch (error) {
      console.error('[OCRService] Error recognizing text:', error);
      throw error;
    }
  }

  /**
   * Parse receipt from OCR text
   */
  parseReceipt(ocrResult: OCRResult): ParsedReceipt {
    const text = ocrResult.text;
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log('[OCRService] Parsing receipt with', lines.length, 'lines');

    return {
      amount: this.extractAmount(text),
      merchant: this.extractMerchant(lines),
      date: this.extractDate(text),
      items: this.extractItems(lines),
      rawText: text,
      confidence: ocrResult.confidence,
    };
  }

  /**
   * Extract total amount from receipt
   */
  private extractAmount(text: string): number | null {
    // Common patterns for total in Brazilian receipts
    const patterns = [
      /(?:total|valor total|total geral|valor)[:\s]*r?\$?\s*([\d.,]+)/i,
      /(?:a pagar|pagar)[:\s]*r?\$?\s*([\d.,]+)/i,
      /r\$\s*([\d.,]+)\s*(?:total|pagar)/i,
      /(?:^|\s)r?\$\s*([\d.,]+)(?:\s|$)/gm, // Any amount with R$
    ];

    let maxAmount = 0;
    let found = false;

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1].replace(/\./g, '').replace(',', '.');
        const amount = parseFloat(amountStr);

        if (!isNaN(amount) && amount > 0) {
          found = true;
          // Usually the largest amount is the total
          if (amount > maxAmount) {
            maxAmount = amount;
          }
        }
      }
    }

    return found ? maxAmount : null;
  }

  /**
   * Extract merchant/store name
   */
  private extractMerchant(lines: string[]): string | null {
    if (lines.length === 0) return null;

    // Usually merchant name is in the first few lines
    // Look for lines with all caps or specific keywords
    const potentialMerchants = lines.slice(0, Math.min(5, lines.length));

    for (const line of potentialMerchants) {
      // Skip lines with only numbers, dates, or addresses
      if (/^\d+$/.test(line)) continue;
      if (/\d{2}\/\d{2}\/\d{4}/.test(line)) continue;
      if (/cnpj|cpf|tel|telefone/i.test(line)) continue;

      // Merchant name is usually all caps or title case
      if (line.length > 3 && line.length < 50) {
        // Remove common prefixes
        let merchant = line.replace(/^(loja|mercado|supermercado|padaria)\s+/i, '').trim();

        if (merchant.length > 3) {
          return merchant;
        }
      }
    }

    // Fallback: return first meaningful line
    return potentialMerchants[0] || null;
  }

  /**
   * Extract date from receipt
   */
  private extractDate(text: string): Date | null {
    // Brazilian date formats
    const patterns = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let day: number, month: number, year: number;

        if (pattern === patterns[2]) {
          // YYYY-MM-DD
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          // DD/MM/YYYY or DD-MM-YYYY
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
        }

        // Validate date
        if (
          day >= 1 &&
          day <= 31 &&
          month >= 1 &&
          month <= 12 &&
          year >= 2000 &&
          year <= new Date().getFullYear() + 1
        ) {
          return new Date(year, month - 1, day);
        }
      }
    }

    // Fallback to today
    return new Date();
  }

  /**
   * Extract line items from receipt
   */
  private extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];

    // Pattern for item lines: description + amount
    // Examples:
    // "COCA COLA 2L       5,99"
    // "PÃO FRANCÊS        3,50"
    // "2 x AGUA 500ML     4,00"

    for (const line of lines) {
      // Look for lines with amounts
      const amountMatch = line.match(/r?\$?\s*([\d.,]+)\s*$/i);
      if (!amountMatch) continue;

      const amountStr = amountMatch[1].replace(/\./g, '').replace(',', '.');
      const amount = parseFloat(amountStr);

      if (isNaN(amount) || amount <= 0) continue;

      // Extract description (everything before the amount)
      const description = line.substring(0, line.lastIndexOf(amountMatch[0])).trim();

      if (description.length < 2) continue;

      // Check for quantity
      const qtyMatch = description.match(/^(\d+)\s*x?\s+/i);
      let quantity: number | undefined;
      let finalDescription = description;

      if (qtyMatch) {
        quantity = parseInt(qtyMatch[1]);
        finalDescription = description.substring(qtyMatch[0].length).trim();
      }

      items.push({
        description: finalDescription,
        amount,
        quantity,
      });
    }

    return items;
  }

  /**
   * Full workflow: scan and parse receipt
   */
  async scanReceipt(imageUri: string): Promise<ParsedReceipt> {
    console.log('[OCRService] Starting receipt scan workflow...');

    // 1. Recognize text
    const ocrResult = await this.recognizeText(imageUri);

    // 2. Parse receipt
    const parsedReceipt = this.parseReceipt(ocrResult);

    console.log('[OCRService] Receipt parsed:', {
      amount: parsedReceipt.amount,
      merchant: parsedReceipt.merchant,
      itemCount: parsedReceipt.items.length,
    });

    return parsedReceipt;
  }

  /**
   * Validate parsed receipt
   */
  validateReceipt(receipt: ParsedReceipt): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!receipt.amount || receipt.amount <= 0) {
      errors.push('Valor total não encontrado ou inválido');
    }

    if (!receipt.merchant) {
      errors.push('Nome do estabelecimento não encontrado');
    }

    if (!receipt.date) {
      errors.push('Data não encontrada');
    }

    if (receipt.confidence < 0.5) {
      errors.push('Baixa confiança no reconhecimento de texto');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default OCRService.getInstance();
