/**
 * Local smoke checks for production-resilience guards (no paid OpenAI spend).
 * Usage: node scripts/smoke-resilience.mjs
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';

async function hit(name, path, opts = {}) {
  try {
    const res = await fetch(base + path, opts);
    const text = await res.text();
    console.log(name, res.status, text.slice(0, 220).replace(/\s+/g, ' '));
    return { status: res.status, text };
  } catch (e) {
    console.log(name, 'ERR', e.message);
    return { status: 0, text: e.message };
  }
}

async function main() {
  let failed = 0;
  const long = Array(1300).fill('word').join(' ');

  const short = await hit('short', '/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisMode: 'task2', essay2: 'hi', promptText: 'test' }),
  });
  if (short.status !== 400) failed++;

  const tooLong = await hit('too_long', '/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisMode: 'task2', essay2: long, promptText: 'test' }),
  });
  if (tooLong.status !== 400) failed++;

  const lemon = await hit('lemon_nosig', '/api/webhooks/lemonsqueezy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meta: { event_name: 'order_created' } }),
  });
  // 401 = bad signature with secret set; 500 = secret missing (fail-closed)
  if (lemon.status !== 401 && lemon.status !== 500) failed++;

  const warmSecret = (process.env.WARM_SECRET || process.env.CRON_SECRET || '').trim();
  const warmHeaders = warmSecret ? { Authorization: `Bearer ${warmSecret}` } : {};
  const warm = await hit('warm', '/api/warm', { headers: warmHeaders });
  if (warm.status !== 200) {
    console.log('warm_note expected 200 with WARM_SECRET/CRON_SECRET when configured');
    if (warm.status !== 401 && warm.status !== 503) failed++;
  }

  try {
    const { getPrisma } = await import('../src/lib/prisma.js');
    const p = getPrisma();
    const rows = await p.$queryRaw`SELECT 1 AS ok FROM "LemonWebhookDeadLetter" LIMIT 1`;
    console.log('deadLetter_ok', true, 'query', rows);
  } catch (e) {
    console.log('deadLetter_fail', e.message);
    failed++;
  }

  console.log(failed === 0 ? 'SMOKE_PASS' : `SMOKE_FAIL count=${failed}`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main();
