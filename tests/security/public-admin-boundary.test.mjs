import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const containsFiles = (directory) =>
  existsSync(directory) && readdirSync(directory, { recursive: true, withFileTypes: true })
    .some((entry) => entry.isFile());

test('root artifact excludes every public admin surface', () => {
  const publicAdmin = join(root, 'public/admin');
  assert.equal(containsFiles(publicAdmin), false);

  const packageJson = JSON.parse(read('package.json'));
  assert.match(packageJson.scripts.build, /--filter=!admin-panel(?:\s|$)/);

  const vercel = JSON.parse(read('vercel.json'));
  assert.equal(vercel.buildCommand, 'pnpm build');
  assert.equal(
    vercel.rewrites.some(({ source, destination }) =>
      source.startsWith('/admin') || destination.startsWith('/admin')),
    false,
  );
});

test('production admin authentication contains no mock credential bypass', () => {
  const authSource = read('admin-panel/src/api/auth.js');
  assert.equal(authSource.includes('admin@santis.com'), false);
  assert.equal(authSource.includes('smoke_test_token_12345'), false);
  assert.equal(authSource.includes("authMode: 'mock'"), false);
});

test('completed root build contains no admin artifact or public-admin chunk', () => {
  const dist = join(root, 'dist');
  if (!existsSync(dist)) return;

  assert.equal(existsSync(join(dist, 'admin')), false);

  const pending = [dist];
  while (pending.length) {
    const directory = pending.pop();
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) pending.push(path);
      assert.doesNotMatch(entry.name, /^public_admin_/);
    }
  }
});
