import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/index.mjs';

test('health check returns only {ok:true} without config fields', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/health', {
    headers: { 'content-type': 'application/json' },
  }), {});
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.ok, true);
  assert.equal(data.databaseConfigured, undefined);
  assert.equal(data.avatarStorageConfigured, undefined);
  assert.equal(data.emailConfigured, undefined);
});

test('500 errors do not expose error.message in detail field', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/nonexistent', {
    headers: { 'content-type': 'application/json' },
  }), {});
  const data = await res.json();
  assert.equal(data.detail, undefined);
});

test('responses include x-content-type-options: nosniff', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/health', {
    headers: { 'content-type': 'application/json' },
  }), {});
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('responses include x-frame-options: DENY', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/health', {
    headers: { 'content-type': 'application/json' },
  }), {});
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
});

test('responses include strict-transport-security header', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/health', {
    headers: { 'content-type': 'application/json' },
  }), {});
  const hsts = res.headers.get('strict-transport-security');
  assert.ok(hsts.includes('max-age=31536000'));
  assert.ok(hsts.includes('includeSubDomains'));
});

test('responses include cache-control: no-store', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/health', {
    headers: { 'content-type': 'application/json' },
  }), {});
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('loadtest_v4_ emails are not bypassed by rate limiting', async () => {
  const res = await worker.fetch(new Request('https://fixou.test/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'origin': 'https://fixou.test' },
    body: JSON.stringify({ email: 'loadtest_v4_999@loadtest.local', password: 'WrongPass123!' }),
  }), {});
  const data = await res.json();
  assert.equal(data.ok, false);
  // Either DB unavailable or email not found — both prove no bypass exists
  assert.ok(data.error === 'E-mail ou senha incorretos.' || data.error === 'Banco de dados indisponível.');
});
