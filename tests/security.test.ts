import assert from 'node:assert/strict';
import { once } from 'node:events';

process.env.RADARRSS_TEST_MODE = '1';
const { app, assertPublicHttpUrl, fetchPublicUrl, readLimitedText, secureDispatcher } = await import('../server');
const originalFetch = globalThis.fetch;
const server = app.listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address() as { port: number };
const base = `http://127.0.0.1:${address.port}`;
let passed = 0;
async function check(name: string, action: () => Promise<void>) {
  await action(); passed++; console.log(`PASS ${name}`);
}
try {
  await check('private, loopback, mapped IPs, alternate IPv4 formats and unsafe schemes are blocked', async () => {
    for (const url of ['http://localhost', 'http://127.0.0.1', 'http://127.1', 'http://2130706433', 'http://0x7f000001', 'http://10.0.0.1', 'http://172.16.0.1', 'http://192.168.1.1', 'http://169.254.169.254', 'http://100.64.0.1', 'http://[::1]', 'http://[::ffff:127.0.0.1]', 'http://[fc00::1]', 'http://[fe80::1]', 'file:///etc/passwd', 'ftp://8.8.8.8', 'https://user:pass@8.8.8.8']) {
      await assert.rejects(() => assertPublicHttpUrl(url), undefined, url);
    }
  });
  await check('public IPv4 and IPv6 URLs remain allowed', async () => {
    await assertPublicHttpUrl('https://8.8.8.8/feed');
    await assertPublicHttpUrl('https://[2606:4700:4700::1111]/feed');
  });
  await check('redirects to private targets are blocked before a second request', async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } }); }) as typeof fetch;
    await assert.rejects(() => fetchPublicUrl('https://8.8.8.8/feed', {}, 1000));
    assert.equal(calls, 1);
  });
  await check('redirect loops stop after six requests', async () => {
    let calls = 0;
    globalThis.fetch = (async () => { calls++; return new Response(null, { status: 302, headers: { location: '/loop' } }); }) as typeof fetch;
    await assert.rejects(() => fetchPublicUrl('https://8.8.8.8/feed', {}, 1000));
    assert.equal(calls, 6);
  });
  await check('declared and streamed oversized responses are rejected', async () => {
    await assert.rejects(() => readLimitedText(new Response('small', { headers: { 'content-length': '100' } }), 10));
    await assert.rejects(() => readLimitedText(new Response('x'.repeat(11)), 10));
    assert.equal(await readLimitedText(new Response('valid'), 10), 'valid');
  });
  globalThis.fetch = originalFetch;
  await check('untrusted origins are rejected', async () => {
    assert.equal((await originalFetch(`${base}/api/rss`, { headers: { origin: 'https://attacker.example' } })).status, 403);
  });
  await check('same-origin preflight succeeds', async () => {
    assert.equal((await originalFetch(`${base}/api/rss`, { method: 'OPTIONS', headers: { origin: base } })).status, 204);
  });
  await check('RSS validation blocks internal requests', async () => {
    const response = await originalFetch(`${base}/api/rss/validate`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'http://127.0.0.1:1/private' }) });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
  });
  await check('public feed fixture is parsed through the HTTP API', async () => {
    globalThis.fetch = (async (input: any, init: any) => {
      assert.equal(String(input), 'https://8.8.8.8/feed');
      assert.equal(init.redirect, 'manual');
      assert.ok(init.dispatcher);
      return new Response('<rss version="2.0"><channel><title>Public feed</title><link>https://example.com</link><description>News</description><item><title>Test story</title><link>https://example.com/story</link><guid>story-1</guid></item></channel></rss>');
    }) as typeof fetch;
    const response = await originalFetch(`${base}/api/rss?urls=${encodeURIComponent('https://8.8.8.8/feed')}`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.items[0].title, 'Test story');
    globalThis.fetch = originalFetch;
  });
  await check('connection-time DNS lookup rejects localhost', async () => {
    await assert.rejects(() => originalFetch('http://localhost:54321', { dispatcher: secureDispatcher } as any), (error: any) => error.cause?.message.includes('endereço público'));
  });
  await check('requests exceeding the feed count limit are rejected', async () => {
    const urls = Array(31).fill('https://8.8.8.8/feed').join(',');
    assert.equal((await originalFetch(`${base}/api/rss?urls=${encodeURIComponent(urls)}`)).status, 400);
  });
  await check('Gemini requests are limited independently', async () => {
    for (let i = 0; i < 20; i++) assert.equal((await originalFetch(`${base}/api/gemini/summarize`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).status, 400);
    const response = await originalFetch(`${base}/api/gemini/summarize`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 429);
    assert.ok(Number(response.headers.get('retry-after')) > 0);
  });
  await check('general API requests reach the rate limit', async () => {
    let status = 200;
    for (let i = 0; i < 121 && status !== 429; i++) status = (await originalFetch(`${base}/api/rss`)).status;
    assert.equal(status, 429);
  });
  console.log(`${passed} security scenarios passed`);
} finally {
  globalThis.fetch = originalFetch;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await secureDispatcher.close();
}
