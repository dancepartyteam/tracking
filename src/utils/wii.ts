import crypto from 'crypto';
import { FastifyRequest } from 'fastify';

// CRC32b hash function to match PHP's hash("crc32b", $value)
export function hashCrc32bDec(value: string): string {
  // Node.js doesn't have built-in CRC32, use a simple implementation
  const crc32 = (str: string): number => {
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  };
  
  // CRC32 lookup table
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[i] = c;
    }
    return table;
  })();
  
  return crc32(value).toString();
}

export function formatWiiResponse(data: Record<string, any>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const hashedKey = hashCrc32bDec(key);
    parts.push(`${hashedKey}=${value}`);
  }

  return `[${parts.join(';')};]`;
}

export function isKeyValid(key: string): boolean {
  const pattern = /^[0-9A-Z]{3}-[0123456789ABCDEFGHJKLMNPQRSTVWXY]{4}-[0123456789ABCDEFGHJKLMNPQRSTVWXY]{4}-[0123456789ABCDEFGHJKLMNPQRSTVWXY]{4}-[0123456789ABCDEFGHJKLMNPQRSTVWXY]{4}$/;
  return pattern.test(key);
}