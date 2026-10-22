import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inspectFile, scanRepository } from './check-secrets.mjs';

test('real environment files are rejected while safe templates are accepted', () => {
  for (const file of ['server/.env', 'client/.env.local', '.env.production']) assert.ok(inspectFile(file, '').length);
  assert.deepEqual(inspectFile('server/.env.example', 'DATABASE_URL=postgresql://fixture:fixture@127.0.0.1:1/unused\nJWT_SECRET=replace-with-a-random-value'), []);
});
test('credential detections never echo credential material', () => {
  const value = ['npg', 'A'.repeat(24)].join('_');
  const findings = inspectFile('settings.txt', `password: ${value}`);
  assert.ok(findings.length);
  assert.equal(JSON.stringify(findings).includes(value), false);
  assert.ok(inspectFile('settings.json', 'postgresql:' + '//owner:' + ['synthetic', 'password'].join('-') + '@database.example/db').length);
});
test('staged scanning checks index content even when the working file is replaced', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'maintainex-secret-check-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'pipe' });
  try {
    git('init', '-q');
    fs.writeFileSync(path.join(root, 'settings.txt'), `DATABASE_URL=postgresql://owner:${'secret'.repeat(4)}@database.example/db`);
    git('add', 'settings.txt');
    fs.writeFileSync(path.join(root, 'settings.txt'), 'clean working file');
    assert.equal(scanRepository(root).length, 0);
    assert.ok(scanRepository(root, true).length);
    git('rm', '--cached', '-f', 'settings.txt');
    assert.deepEqual(scanRepository(root, true), []);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
