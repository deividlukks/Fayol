/**
 * Serviço de Speech-to-Text (STT)
 * Usa Whisper API da OpenAI para transcrever áudios
 */

import axios from 'axios';
import FormData from 'form-data';

export interface STTResult {
  text: string;
  language?: string;
  duration?: number;
}

export class STTService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';

    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY não configurada. STT não funcionará.');
    }
  }

  /**
   * Transcreve áudio usando Whisper API
   */
  async transcribe(audioBuffer: Buffer, fileName: string = 'audio.ogg'): Promise<STTResult> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAI API Key não configurada. Configure OPENAI_API_KEY no .env'
      );
    }

    try {
      // Prepara FormData com o áudio
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: fileName,
        contentType: 'audio/ogg',
      });
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt'); // Português

      // Faz request para Whisper API
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 30000, // 30 segundos
      });

      const text = response.data.text || '';

      return {
        text: text.trim(),
        language: response.data.language,
        duration: response.data.duration,
      };
    } catch (error: any) {
      console.error('❌ Erro ao fazer STT:', error);

      if (error.response?.status === 401) {
        throw new Error('OpenAI API Key inválida');
      } else if (error.response?.status === 429) {
        throw new Error('Limite de requisições OpenAI atingido. Tente novamente mais tarde.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout ao transcrever áudio. Tente um áudio mais curto.');
      }

      throw new Error('Falha ao transcrever áudio');
    }
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Valida se o áudio está dentro dos limites aceitáveis
   * Whisper API aceita até 25MB
   */
  validateAudio(audioBuffer: Buffer): { valid: boolean; error?: string } {
    const maxSize = 25 * 1024 * 1024; // 25MB

    if (audioBuffer.length > maxSize) {
      return {
        valid: false,
        error: 'Áudio muito grande. Máximo: 25MB',
      };
    }

    if (audioBuffer.length === 0) {
      return {
        valid: false,
        error: 'Áudio vazio',
      };
    }

    return { valid: true };
  }
}
