import 'server-only';
import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

let configured = false;

/** Configure Lemon Squeezy SDK once per process (API key from env). */
export function ensureLemonSqueezyConfigured() {
  if (configured) return;
  const apiKey = String(process.env.LEMON_SQUEEZY_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('LEMON_SQUEEZY_API_KEY is not set');
  }
  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error('[lemonsqueezy]', error?.message || error);
    },
  });
  configured = true;
}

export function getLemonStoreId() {
  const id = String(process.env.LEMON_SQUEEZY_STORE_ID || '').trim();
  if (!id) throw new Error('LEMON_SQUEEZY_STORE_ID is not set');
  return id;
}

export function getLemonWebhookSecret() {
  return String(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '').trim();
}

export function isLemonSqueezyConfigured() {
  return Boolean(
    String(process.env.LEMON_SQUEEZY_API_KEY || '').trim() &&
      String(process.env.LEMON_SQUEEZY_STORE_ID || '').trim()
  );
}
