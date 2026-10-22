import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
// @ts-expect-error Operational native ESM module has no TypeScript declaration.
import { encryptCredential, decryptCredential } from '../scripts/credential-crypto.mjs';

test('credential rekeying preserves token content and rejects the retired key', () => {
  const oldKey = crypto.randomBytes(32).toString('hex');
  const nextKey = crypto.randomBytes(32).toString('hex');
  const token = crypto.randomBytes(32).toString('base64url');
  const before = encryptCredential(token, oldKey);
  const after = encryptCredential(decryptCredential(before, oldKey), nextKey);
  assert.notEqual(before, after);
  assert.equal(decryptCredential(after, nextKey), token);
  assert.throws(() => decryptCredential(after, oldKey));
});
test('tampered envelopes fail authentication', () => {
  const key = crypto.randomBytes(32).toString('hex');
  const parts = encryptCredential('isolated-fixture-token', key).split(':');
  const bytes = Buffer.from(parts[3], 'base64url'); bytes[0] ^= 1; parts[3] = bytes.toString('base64url');
  assert.throws(() => decryptCredential(parts.join(':'), key));
});
