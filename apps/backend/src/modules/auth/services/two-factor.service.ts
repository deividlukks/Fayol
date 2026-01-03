import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { TwoFactorSetupResponse, BackupCodesResponse } from '@fayol/shared-types';

@Injectable()
export class TwoFactorService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: Buffer;

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private configService: ConfigService
  ) {
    // Initialize encryption key from env (32 bytes for AES-256)
    const key = this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY');
    if (!key || key.length !== 64) {
      throw new Error('TWO_FACTOR_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }
    this.encryptionKey = Buffer.from(key, 'hex');
  }

  /**
   * Encrypts the TOTP secret before storing in database
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypts the TOTP secret from database
   */
  private decrypt(text: string): string {
    // Validação de formato
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid encrypted text: must be a non-empty string');
    }

    const parts = text.split(':');

    // Valida que temos exatamente 2 partes (iv:encrypted)
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format: expected "iv:encrypted"');
    }

    const [ivHex, encryptedText] = parts;

    // Valida que ambas as partes não estão vazias
    if (!ivHex || !encryptedText) {
      throw new Error('Invalid encrypted text: iv or encrypted text is empty');
    }

    // Valida que são strings hexadecimais válidas
    if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedText)) {
      throw new Error('Invalid encrypted text: must be hexadecimal');
    }

    try {
      const iv = Buffer.from(ivHex, 'hex');

      // Valida tamanho do IV (deve ser 16 bytes para AES)
      if (iv.length !== 16) {
        throw new Error('Invalid IV length: expected 16 bytes');
      }

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      // SEGURANÇA: Não expõe detalhes de criptografia no erro
      throw new Error('Failed to decrypt text: invalid encryption or corrupted data');
    }
  }

  /**
   * Generates backup codes (8 codes, 10 characters each)
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hashes backup codes before storage
   */
  private async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
  }

  /**
   * Step 1: Generate 2FA secret and QR code
   */
  async setup2FA(userId: string, password: string): Promise<TwoFactorSetupResponse> {
    // Verify password
    const user = await this.usersService.findOne(userId);
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Fayol (${user.email})`,
      issuer: 'Fayol',
    });

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    // Store encrypted secret temporarily (not activated until verified)
    const encryptedSecret = this.encrypt(secret.base32);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorEnabled: false, // Not enabled until verified
      },
    });

    return {
      qrCodeUrl,
      secret: secret.base32,
      backupCodes,
    };
  }

  /**
   * Step 2: Verify setup by validating TOTP code
   */
  async verifySetup(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Decrypt secret
    const secret = this.decrypt(user.twoFactorSecret);

    // Verify code
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time steps before/after for clock drift
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
      },
    });

    return { message: '2FA enabled successfully' };
  }

  /**
   * Verify TOTP code during login
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    const secret = this.decrypt(user.twoFactorSecret);

    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
  }

  /**
   * Verify backup code during login
   */
  async verifyBackupCode(userId: string, backupCode: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || user.twoFactorBackupCodes.length === 0) {
      return false;
    }

    // Check if backup code matches any stored code
    for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
      const isMatch = await bcrypt.compare(backupCode, user.twoFactorBackupCodes[i]);
      if (isMatch) {
        // Remove used backup code
        const updatedCodes = user.twoFactorBackupCodes.filter((_, index) => index !== i);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorBackupCodes: updatedCodes,
          },
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, password: string, code: string): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify current TOTP code
    const isCodeValid = await this.verifyCode(userId, code);
    if (!isCodeValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorTempToken: null,
        twoFactorTempExpires: null,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string, password: string): Promise<BackupCodesResponse> {
    const user = await this.usersService.findOne(userId);

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await this.hashBackupCodes(backupCodes);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    return {
      backupCodes,
      message: 'Backup codes regenerated successfully',
    };
  }

  /**
   * Generate temporary token for 2FA flow during login
   */
  async generateTempToken(userId: string): Promise<string> {
    const tempToken = crypto.randomBytes(32).toString('hex');
    const tempExpires = new Date(Date.now() + 300000); // 5 minutes

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorTempToken: tempToken,
        twoFactorTempExpires: tempExpires,
      },
    });

    return tempToken;
  }

  /**
   * Validate temporary token
   */
  async validateTempToken(tempToken: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        twoFactorTempToken: tempToken,
        twoFactorTempExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return null;
    }

    return user.id;
  }

  /**
   * Clear temporary token after successful 2FA
   */
  async clearTempToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorTempToken: null,
        twoFactorTempExpires: null,
      },
    });
  }

  /**
   * Get 2FA status for a user
   */
  async get2FAStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: user.twoFactorBackupCodes.length,
    };
  }
}
