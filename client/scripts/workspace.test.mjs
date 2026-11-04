import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

async function sourceModule(file) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const routes = await sourceModule('../shared/lib/routes.ts');
const dates = await sourceModule('../shared/lib/workDates.ts');

test('public entry is independent while personal and community routes stay protected', () => {
  for (const path of ['/', '/login', '/signup', '/design-system']) assert.equal(routes.isPublicRoute(path), true);
  for (const path of ['/dashboard', '/activities', '/pins', '/schedule', '/community', '/profile/edit', '/design-system/private']) assert.equal(routes.isPublicRoute(path), false);
});
test('auth return paths reject external redirects, credentials and public loops', () => {
  for (const value of [null, '', '//evil.example', 'https://evil.example', '/\\evil.example', '/login', '/signup', '/', '/api/auth', '/dashboard?token=secret', '/dashboard#token', '/path with space']) assert.equal(routes.workspaceDestination(value), '/dashboard');
  assert.equal(routes.workspaceDestination('/pins/known-id'), '/pins/known-id');
  assert.equal(routes.workspaceDestination('/schedule/new'), '/schedule/new');
});
test('calendar deadlines handle year transitions and DST without elapsed-day drift', () => {
  assert.equal(dates.dueLabel('2026-10-22T00:00:00.000Z', 'PLANNED', new Date(2026, 9, 22, 23, 59)), 'Due today');
  assert.equal(dates.dueLabel('2027-01-01', 'PLANNED', new Date(2026, 11, 31)), 'Due in 1 day');
  assert.equal(dates.dueLabel('2026-03-09', 'PLANNED', new Date(2026, 2, 8)), 'Due in 1 day');
  assert.equal(dates.dueLabel('2026-10-20', 'BLOCKED', new Date(2026, 9, 22)), 'Overdue by 2 days');
});
test('completed and cancelled work never appears overdue', () => {
  assert.equal(dates.dueLabel('2000-01-01', 'DONE'), 'Completed');
  assert.equal(dates.dueLabel('2000-01-01', 'CANCELLED'), 'Cancelled');
  assert.equal(dates.dueLabel(null, 'PLANNED'), 'No due date');
});
