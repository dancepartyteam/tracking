import crypto from 'crypto';

export class TokenService {
  private static readonly KEY = Buffer.from(process.env.TOKEN_KEY || '', 'hex');
  private static readonly IV = Buffer.from(process.env.TOKEN_IV || '', 'hex');
  private static readonly MAGIC = Buffer.from(process.env.TOKEN_MAGIC || '', 'hex');

  /**
   * Decrypt NDS token and extract MAC address
   * Token format from NAS server:
   * - timestamp (8 bytes)
   * - gamecd (4 bytes)
   * - userid (6 bytes)
   * - region (1 byte)
   * - lang (1 byte)
   * - challenge (8 bytes)
   * - ipAddress (15 bytes)
   * - macAddress (17 bytes) - format: AA:BB:CC:DD:EE:FF
   * - magic (variable length)
   */
  static decryptToken(encryptedToken: string, productToken?: string): { 
    macAddress: string;
    gamecd?: string;
    userid?: number;
    timestamp?: number;
    ipAddress?: string;
  } | null {
    try {
      // Token should start with "NDS"
      if (!encryptedToken.startsWith('NDS')) {
        console.error('Token does not start with NDS prefix');
        return null;
      }

      // Remove NDS prefix and decode base64
      const data = Buffer.from(encryptedToken.slice(3), 'base64');

      // Decrypt using AES-256-CBC
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.KEY, this.IV);
      const decrypted = Buffer.concat([
        decipher.update(data),
        decipher.final()
      ]);

      // Parse fields
      let offset = 0;

      // Timestamp (8 bytes, Little Endian)
      const timestamp = Number(decrypted.readBigUInt64LE(offset));
      offset += 8;

      // Game code (4 bytes)
      const gamecd = decrypted.slice(offset, offset + 4).toString('utf8').replace(/\0/g, '');
      offset += 4;

      // User ID (6 bytes)
      const userid = Number(decrypted.readBigUInt64LE(offset) & BigInt('0xFFFFFFFFFFFF'));
      offset += 6;

      // Region and lang (1 byte each)
      const region = decrypted[offset++];
      const lang = decrypted[offset++];

      // Challenge (8 bytes)
      const challenge = decrypted.slice(offset, offset + 8).toString('utf8');
      offset += 8;

      // IP address (15 bytes)
      const ipAddress = decrypted.slice(offset, offset + 15).toString('utf8').replace(/\0/g, '');
      offset += 15;

      // MAC address (17 bytes) - format: AA:BB:CC:DD:EE:FF
      const macAddress = decrypted.slice(offset, offset + 17).toString('utf8').replace(/\0/g, '');
      offset += 17;

      // Verify magic
      const magic = decrypted.slice(offset, offset + this.MAGIC.length);
      if (!magic.equals(this.MAGIC)) {
        console.error('Invalid magic in token');
        return null;
      }

      // Return extracted data
      return {
        macAddress,
        gamecd,
        userid,
        timestamp,
        ipAddress
      };
    } catch (error) {
      console.error('Token decryption failed:', error);
      return null;
    }
  }

  /**
   * Generate SHA1 hash from array of strings (matches PHP's HashKey::buildHashKey)
   */
  static generateHashKey(data: string[]): string {
    const combined = data.join('');
    return crypto.createHash('sha1').update(combined).digest('hex');
  }

  /**
   * Generate random password (matches PHP's Password::generatePassword)
   */
  static generatePassword(length: number = 8): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const number = '0123456789';
    const seed = upper + lower + number;
    
    let password = '';
    for (let i = 0; i < length; i++) {
      password += seed[Math.floor(Math.random() * seed.length)];
    }
    return password;
  }

  /**
   * Format MAC address from AA-BB-CC-DD-EE-FF to AA:BB:CC:DD:EE:FF
   */
  private static formatMacAddress(macAddress: string): string {
    if (!macAddress) return '';
    return macAddress.replace(/-/g, ':').toUpperCase();
  }
}