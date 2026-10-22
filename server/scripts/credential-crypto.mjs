import crypto from 'node:crypto';

const keyBytes = key => crypto.createHash('sha256').update(key).digest();
export function decryptCredential(value, key) {
  if (!value.startsWith('v1:')) return value;
  const parts = value.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted credential format');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes(key), Buffer.from(parts[1], 'base64url'));
  decipher.setAuthTag(Buffer.from(parts[2], 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64url')), decipher.final()]).toString('utf8');
}
export function encryptCredential(value, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes(key), iv);
  const body = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${body.toString('base64url')}`;
}
