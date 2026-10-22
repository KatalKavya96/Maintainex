/** Explicit incident response: revoke known copied credentials, preserve contribution records. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { decryptCredential } from './credential-crypto.mjs';

const configPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
const config = Object.fromEntries(fs.readFileSync(configPath, 'utf8').split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].trim().replace(/^["']|["']$/g, '')]] : [];
}));
const db = new PrismaClient({ datasources: { db: { url: config.DATABASE_URL } }, log: [] });
let revoked = 0;
try {
  const integrations = await db.gitHubIntegration.findMany({ select: { id: true, accessTokenEncrypted: true } });
  const accounts = await db.authAccount.findMany({ where: { provider: 'GITHUB' }, select: { id: true, accessTokenEncrypted: true, refreshTokenEncrypted: true } });
  const tokens = new Set([...integrations.map(x => x.accessTokenEncrypted), ...accounts.flatMap(x => [x.accessTokenEncrypted, x.refreshTokenEncrypted])].filter(Boolean).map(value => decryptCredential(value, config.GITHUB_TOKEN_ENCRYPTION_KEY)));
  if (!process.argv.includes('--execute')) {
    console.log(JSON.stringify({ mode: 'dry-run', integration_records: integrations.length, authentication_records: accounts.length, unique_tokens: tokens.size }));
  } else {
    if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CLIENT_SECRET) throw new Error('OAuth application credentials unavailable');
    for (const token of tokens) {
      const response = await fetch(`https://api.github.com/applications/${encodeURIComponent(config.GITHUB_CLIENT_ID)}/token`, {
        method: 'DELETE',
        headers: { Authorization: `Basic ${Buffer.from(`${config.GITHUB_CLIENT_ID}:${config.GITHUB_CLIENT_SECRET}`).toString('base64')}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2026-03-10' },
        body: JSON.stringify({ access_token: token }), signal: AbortSignal.timeout(15000)
      });
      if (response.status !== 204 && response.status !== 404) throw Object.assign(new Error('Provider revocation incomplete'), { code: `GITHUB_HTTP_${response.status}` });
      revoked += 1;
    }
    await db.$transaction([
      db.gitHubIntegration.deleteMany({ where: { id: { in: integrations.map(x => x.id) } } }),
      db.authAccount.updateMany({ where: { id: { in: accounts.map(x => x.id) } }, data: { accessTokenEncrypted: null, refreshTokenEncrypted: null } })
    ]);
    console.log(JSON.stringify({ known_tokens_revoked_or_already_invalid: revoked, integration_records_disconnected: integrations.length, provider_identity_records_preserved: accounts.length, contribution_records_changed: false }));
  }
} catch (error) {
  console.error(JSON.stringify({ revocation_incomplete: true, known_tokens_processed: revoked, error_code: error.code || 'OPERATION_FAILED', details_redacted: true })); process.exitCode = 1;
} finally { await db.$disconnect(); }
