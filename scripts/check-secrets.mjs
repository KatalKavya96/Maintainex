import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const environmentFile = /(^|\/)(?:\.env(?:\..*)?|[^/]+\.(?:pem|p12|pfx)|id_(?:rsa|ed25519))$/i;
const templateFile = /(^|\/)\.env\.(?:example|template|sample)$/i;
const placeholder = /^(?:$|your[-_ ]|replace[-_ ]|change[-_ ]|example|placeholder|changeme|dev-only|isolated[-_ ]|fixture)/i;

/** Return locations and rule names only. Never include matched secret text. */
export function inspectFile(file, text) {
  const findings = [];
  if (environmentFile.test(file) && !templateFile.test(file)) findings.push({ file, line: 1, rule: 'private configuration must not be tracked' });
  text.split(/\r?\n/).forEach((line, index) => {
    const add = rule => findings.push({ file, line: index + 1, rule });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(line)) add('private key');
    if (/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|npg_[A-Za-z0-9]{12,})\b/.test(line)) add('provider credential');
    for (const match of line.matchAll(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi)) {
      try {
        const url = new URL(match[0]);
        const password = decodeURIComponent(url.password);
        const fixture = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && ['fixture', 'password', 'postgres'].includes(password);
        if (password && !fixture && !placeholder.test(password)) add('database URL contains a password');
      } catch { /* Other validation owns malformed configuration. */ }
    }
    const assignment = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*(?:SECRET|PASSWORD|API_KEY|ENCRYPTION_KEY|ADMIN_CODE))\s*=\s*["']?([^"'\s#]+)/);
    if (assignment && assignment[2].length >= 8 && !placeholder.test(assignment[2])) add('literal credential assignment');
  });
  return findings;
}

export function scanRepository(root, staged = false) {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const files = git(staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z']).split('\0').filter(Boolean);
  return files.flatMap(file => {
    if (staged) return inspectFile(file, git(['show', `:${file}`]));
    const full = path.join(root, file);
    if (!fs.existsSync(full)) return [];
    const content = fs.lstatSync(full).isSymbolicLink() ? fs.readlinkSync(full) : fs.readFileSync(full, 'utf8');
    return inspectFile(file, content);
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    const findings = scanRepository(process.cwd(), process.argv.includes('--staged'));
    if (findings.length) {
      console.error('Secret check failed. Remove private files from tracking and rotate any exposed credentials.');
      for (const item of findings) console.error(`${item.file}:${item.line}: ${item.rule}`);
      process.exitCode = 1;
    } else console.log('Secret check passed (current files only; not a historical or provider-side audit).');
  } catch { console.error('Secret check could not complete. Commit blocked; inspect repository access without printing secrets.'); process.exitCode = 1; }
}
