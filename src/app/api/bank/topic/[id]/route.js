import { NextResponse } from 'next/server';
import * as bank from '@/lib/bankCore.js';

/** Mirrors Express bank route: short-lived in-process cache per server instance */
const detailCache = new Map();
const CACHE_TTL_MS = 120_000;

function cacheGet(key) {
  const row = detailCache.get(key);
  if (!row) return undefined;
  if (Date.now() - row.at > CACHE_TTL_MS) {
    detailCache.delete(key);
    return undefined;
  }
  return row.payload;
}

function cacheSet(key, payload) {
  detailCache.set(key, { payload, at: Date.now() });
}

/**
 * GET /api/bank/topic/:id
 */
export async function GET(_request, context) {
  try {
    const params = await context.params;
    const id = params?.id;
    const cacheKey = String(id);
    const hit = cacheGet(cacheKey);
    if (hit) {
      return NextResponse.json(hit);
    }
    const topic = bank.getTopicById(id);
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    const payload = bank.topicDetailPayload(topic);
    if (!payload) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    cacheSet(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    console.error('[api/bank/topic]', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
