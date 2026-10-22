/** Explicit incident-response command. Never prints credentials or exception messages. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { decryptCredential, encryptCredential } from './credential-crypto.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const pendingPath = path.join(root, '.env.rotation.pending');
const original = fs.readFileSync(envPath, 'utf8');
const config = Object.fromEntries(original.split(/\r?\n/).flatMap(line => {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  return match ? [[match[1], match[2].trim().replace(/^["']|["']$/g, '')]] : [];
}));
const expected = process.argv[process.argv.indexOf('--expected-endpoint') + 1];
const address = new URL(config.DATABASE_URL);
if (!process.argv.includes('--expected-endpoint') || !expected || !address.hostname.startsWith(`${expected}.`) && !address.hostname.startsWith(`${expected}-pooler.`)) {
  console.error('Endpoint confirmation is required and must match the configured database.'); process.exit(1);
}
const client = url => new PrismaClient({ datasources: { db: { url } }, log: [] });
const oldClient = client(config.DATABASE_URL);
let updatedClient;
let databaseCommitted = false;
try {
  const identity = await oldClient.$queryRawUnsafe('SELECT current_user AS role');
  const integrations = await oldClient.gitHubIntegration.count();
  const accounts = await oldClient.authAccount.count();
  if (!process.argv.includes('--execute')) {
    console.log(JSON.stringify({ mode: 'dry-run', database_reachable: true, github_integrations: integrations, authentication_accounts: accounts }));
  } else {
    if (fs.existsSync(pendingPath)) throw new Error('Pending rotation requires recovery review');
    const oldKey = config.GITHUB_TOKEN_ENCRYPTION_KEY || config.JWT_SECRET;
    if (!oldKey) throw new Error('Existing encryption key is unavailable');
    const newKey = crypto.randomBytes(32).toString('hex');
    const jwtKey = crypto.randomBytes(32).toString('hex');
    const password = crypto.randomBytes(32).toString('base64url');
    address.password = password;
    const nextValues = { DATABASE_URL: address.toString(), GITHUB_TOKEN_ENCRYPTION_KEY: newKey, JWT_SECRET: jwtKey };
    let updated = original;
    for (const [name, value] of Object.entries(nextValues)) {
      const line = `${name}="${value}"`;
      const pattern = new RegExp(`^${name}=.*$`, 'm');
      updated = pattern.test(updated) ? updated.replace(pattern, line) : `${updated.trimEnd()}\n${line}\n`;
    }
    fs.writeFileSync(pendingPath, updated, { mode: 0o600, flag: 'wx' });
    const migrate = async tx => {
      let changed = 0;
      const rewrite = value => {
        if (!value) return value;
        if (value.startsWith("v1:")) {
          try { decryptCredential(value, newKey); return value; } catch { /* Try the explicitly retired key. */ }
        }
        const plaintext = decryptCredential(value, oldKey);
        const encrypted = encryptCredential(plaintext, newKey);
        if (decryptCredential(encrypted, newKey) !== plaintext) throw new Error('Credential verification failed');
        changed += 1;
        return encrypted;
      };
      for (const item of await tx.gitHubIntegration.findMany({ select: { id: true, accessTokenEncrypted: true } }))
        await tx.gitHubIntegration.update({ where: { id: item.id }, data: { accessTokenEncrypted: rewrite(item.accessTokenEncrypted) } });
      for (const item of await tx.authAccount.findMany({ select: { id: true, accessTokenEncrypted: true, refreshTokenEncrypted: true } }))
        await tx.authAccount.update({ where: { id: item.id }, data: { accessTokenEncrypted: rewrite(item.accessTokenEncrypted), refreshTokenEncrypted: rewrite(item.refreshTokenEncrypted) } });
      return changed;
    };
    const role = identity[0].role.replaceAll('"', '""');
    const rekeyed = await oldClient.$transaction(async tx => {
      const count = await migrate(tx);
      await tx.$executeRawUnsafe(`ALTER ROLE "${role}" WITH PASSWORD '${password}'`);
      return count;
    }, { timeout: 30000, isolationLevel: 'Serializable' });
    databaseCommitted = true;
    fs.renameSync(pendingPath, envPath);
    fs.chmodSync(envPath, 0o600);
    updatedClient = client(nextValues.DATABASE_URL);
    await updatedClient.$queryRawUnsafe('SELECT 1');
    const sessions = await updatedClient.$queryRawUnsafe("SELECT pg_terminate_backend(pid) AS terminated FROM pg_stat_activity WHERE usename = current_user AND pid <> pg_backend_pid() AND backend_type = 'client backend'");
    const lateRekeyed = await updatedClient.$transaction(migrate, { timeout: 30000 });
    await oldClient.$disconnect();
    const retired = client(config.DATABASE_URL);
    let retiredRejected = false;
    try { await retired.$queryRawUnsafe('SELECT 1'); } catch { retiredRejected = true; } finally { await retired.$disconnect(); }
    console.log(JSON.stringify({ database_password_rotated: true, new_database_login_verified: true, retired_database_login_rejected: retiredRejected, encrypted_fields_rekeyed: rekeyed + lateRekeyed, previous_sessions_terminated: sessions.filter(x=>x.terminated).length, local_environment_updated: true, local_session_signing_key_rotated: true, github_oauth_client_secret_rotated: false, deployment_environment_updated: false }));
    if (!retiredRejected) process.exitCode = 2;
  }
} catch (error) {
  console.error(JSON.stringify({ rotation_failed: true, database_transaction_committed: databaseCommitted, recovery_file_exists: fs.existsSync(pendingPath), error_code: error.code || 'OPERATION_FAILED', details_redacted: true })); process.exitCode = 1;
} finally { await oldClient.$disconnect(); await updatedClient?.$disconnect(); }
