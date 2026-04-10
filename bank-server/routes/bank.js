import express from 'express';
import * as bank from '../../src/lib/bankCore.js';

const router = express.Router();

/**
 * In-memory cache for topic detail JSON (static JSON data; short TTL avoids stale after admin edits).
 * For Redis, replace this map with ioredis client calls.
 */
const detailCache = new Map();
const CACHE_TTL_MS = Number(process.env.BANK_TOPIC_CACHE_TTL_MS) || 120_000;

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
 * Returns id, title, taskType, subtype, examDate, promptText, keywords
 */
router.get('/topic/:id', (req, res) => {
  const rawId = req.params.id;
  const cacheKey = String(rawId);
  try {
    const hit = cacheGet(cacheKey);
    if (hit) {
      return res.json(hit);
    }
    const topic = bank.getTopicById(rawId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    const payload = bank.topicDetailPayload(topic);
    if (!payload) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    cacheSet(cacheKey, payload);
    return res.json(payload);
  } catch (e) {
    console.error('[bank/topic]', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
