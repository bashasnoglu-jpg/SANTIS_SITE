import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const containsFiles = (directory) =>
  existsSync(directory) && readdirSync(directory, { recursive: true, withFileTypes: true })
    .some((entry) => entry.isFile());

const startDistServer = async (dist) => {
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
    const relativePath = pathname.replace(/^\/+/, '');
    const candidate = join(dist, relativePath);

    if (!candidate.startsWith(dist)) {
      response.statusCode = 403;
      response.end('Forbidden');
      return;
    }

    if (existsSync(candidate) && statSync(candidate).isFile()) {
      response.statusCode = 200;
      response.end(readFileSync(candidate));
      return;
    }

    const indexCandidate = join(candidate, 'index.html');
    if (existsSync(indexCandidate) && statSync(indexCandidate).isFile()) {
      response.statusCode = 200;
      response.end(readFileSync(indexCandidate));
      return;
    }

    response.statusCode = 404;
    response.end('Not Found');
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once('error', rejectListen);
    server.listen(0, '127.0.0.1', resolveListen);
  });

  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
};

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
  assert.equal(
    existsSync(dist),
    true,
    "SECURITY FAIL: 'dist' directory missing. Build precondition failed.",
  );

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

test('completed root build denies admin paths over HTTP', async () => {
  const dist = join(root, 'dist');
  assert.equal(
    existsSync(dist),
    true,
    "SECURITY FAIL: 'dist' directory missing. Build precondition failed.",
  );

  const { server, baseUrl } = await startDistServer(dist);

  try {
    for (const pathname of ['/admin', '/admin/', '/admin/login']) {
      const response = await fetch(`${baseUrl}${pathname}`, { redirect: 'manual' });
      assert.equal(
        [401, 403, 404].includes(response.status),
        true,
        `SECURITY FAIL: ${pathname} returned HTTP ${response.status}; expected 401, 403, or 404.`,
      );
    }
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => error ? rejectClose(error) : resolveClose());
    });
  }
});
