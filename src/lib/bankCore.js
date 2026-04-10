/**
 * IELTS Writing bank — topics & templates (shared by Next.js API and optional Express server).
 * Data: /data/topics.json, /data/templates.json (project root).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '..', '..');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const TOPICS_FILE = path.join(DATA_DIR, 'topics.json');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

export const TASK1_SUB = new Set(['graph', 'table', 'process', 'letter']);
export const TASK2_SUB = new Set(['opinion', 'discussion', 'problem-solution']);

export const LIMITS = {
  topicTitle: 200,
  templateTitle: 200,
  templateExample: 1000,
  structureItem: 500,
  phraseValue: 400,
};

export function dataDir() {
  return DATA_DIR;
}

function readJsonSafe(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function readTopics() {
  return readJsonSafe(TOPICS_FILE);
}

export function readTemplates() {
  return readJsonSafe(TEMPLATES_FILE);
}

function writeTemplates(list) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(list, null, 2), 'utf8');
}

export function sanitizeText(s, maxLen) {
  if (typeof s !== 'string') return '';
  const t = s.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

function validSubtype(type, subtype) {
  if (type === 'task1') return TASK1_SUB.has(subtype);
  if (type === 'task2') return TASK2_SUB.has(subtype);
  return false;
}

function parseDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchesDateRange(topicDateStr, dateFrom, dateTo) {
  const t = parseDate(topicDateStr);
  if (!t) return false;
  if (dateFrom) {
    const f = parseDate(dateFrom);
    if (f && t < f) return false;
  }
  if (dateTo) {
    const to = parseDate(dateTo);
    if (to && t > to) return false;
  }
  return true;
}

function keywordMatch(text, q) {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return String(text).toLowerCase().includes(needle);
}

export function filterTopics(q) {
  let list = readTopics();
  const type = q.type?.toLowerCase();
  const subtype = q.subtype?.toLowerCase();
  const { dateFrom, dateTo } = q;
  const search = q.q || q.search;

  if (type === 'task1' || type === 'task2') {
    list = list.filter((t) => t.type === type);
  }
  if (subtype) {
    list = list.filter((t) => t.subtype === subtype);
  }
  if (dateFrom || dateTo) {
    list = list.filter((t) => matchesDateRange(t.date, dateFrom, dateTo));
  }
  if (search) {
    list = list.filter((t) => keywordMatch(t.title, search));
  }
  return list;
}

export function filterTemplates(q) {
  let list = readTemplates();
  const type = q.type?.toLowerCase();
  const subtype = q.subtype?.toLowerCase();
  const { dateFrom, dateTo } = q;
  const search = q.q || q.search;

  if (type === 'task1' || type === 'task2') {
    list = list.filter((t) => t.type === type);
  }
  if (subtype) {
    list = list.filter((t) => t.subtype === subtype);
  }
  if (dateFrom || dateTo) {
    list = list.filter((t) => t.date && matchesDateRange(t.date, dateFrom, dateTo));
  }
  if (search) {
    list = list.filter(
      (t) =>
        keywordMatch(t.title, search) ||
        keywordMatch(t.example || '', search) ||
        (Array.isArray(t.structure) && t.structure.some((line) => keywordMatch(line, search)))
    );
  }
  return list;
}

export function validatePostTemplate(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }
  const title = sanitizeText(String(body.title || ''), LIMITS.templateTitle);
  const type = String(body.type || '').toLowerCase();
  const subtype = String(body.subtype || '').toLowerCase();
  if (!title) errors.push(`title is required (max ${LIMITS.templateTitle} chars)`);
  if (type !== 'task1' && type !== 'task2') errors.push('type must be task1 or task2');
  if (!validSubtype(type, subtype)) errors.push('invalid subtype for type');
  if (!Array.isArray(body.structure) || body.structure.length === 0) {
    errors.push('structure must be a non-empty array of strings');
  } else {
    for (let i = 0; i < body.structure.length; i++) {
      const line = sanitizeText(String(body.structure[i]), LIMITS.structureItem);
      if (!line) errors.push(`structure[${i}] is empty or invalid`);
    }
  }
  if (body.phrases == null || typeof body.phrases !== 'object' || Array.isArray(body.phrases)) {
    errors.push('phrases must be a non-null object');
  }
  const example = sanitizeText(String(body.example || ''), LIMITS.templateExample);
  if (!example) errors.push(`example is required (max ${LIMITS.templateExample} chars)`);

  if (errors.length) return { ok: false, errors };

  const phrases = {};
  const allowedKeys = ['introduction', 'overview', 'body', 'conclusion'];
  for (const k of allowedKeys) {
    if (body.phrases[k] != null) {
      phrases[k] = sanitizeText(String(body.phrases[k]), LIMITS.phraseValue);
    }
  }
  const structure = body.structure.map((s) => sanitizeText(String(s), LIMITS.structureItem));

  return {
    ok: true,
    payload: { title, type, subtype, structure, phrases, example },
  };
}

function adminAuthorized(headers, adminKey) {
  if (!adminKey) {
    return process.env.NODE_ENV === 'development';
  }
  const h = headers && headers['x-bank-admin-key'];
  return h === adminKey;
}

export function addTemplate(body, headers) {
  const adminKey = process.env.BANK_ADMIN_KEY || '';
  if (!adminAuthorized(headers, adminKey)) {
    return { ok: false, status: 403, error: 'Forbidden: invalid or missing admin key' };
  }
  const v = validatePostTemplate(body);
  if (!v.ok) {
    return { ok: false, status: 400, error: v.errors.join('; ') };
  }
  const list = readTemplates();
  const nextId = list.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0) + 1;
  const row = {
    id: nextId,
    ...v.payload,
    date: new Date().toISOString().slice(0, 10),
  };
  list.push(row);
  try {
    writeTemplates(list);
  } catch {
    return { ok: false, status: 500, error: 'Failed to save templates' };
  }
  return { ok: true, status: 201, template: row };
}

export function getTemplateById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  const list = readTemplates();
  return list.find((t) => Number(t.id) === n) || null;
}

/** Single topic by numeric id (Writing bank). */
export function getTopicById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;
  const list = readTopics();
  return list.find((t) => Number(t.id) === n) || null;
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'have', 'has', 'been', 'were', 'was',
  'are', 'not', 'but', 'what', 'when', 'where', 'which', 'while', 'into', 'about', 'than',
  'then', 'some', 'such', 'both', 'each', 'more', 'most', 'other', 'many', 'much', 'your',
]);

function extractKeywordsFromText(text, max = 14) {
  const words = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const seen = new Set();
  const out = [];
  for (const w of words) {
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Normalized topic for GET /api/bank/topic/:id (matches Topics UI contract).
 */
export function topicDetailPayload(topic) {
  if (!topic || typeof topic !== 'object') return null;
  const promptText =
    typeof topic.promptText === 'string' && topic.promptText.trim()
      ? topic.promptText.trim()
      : String(topic.title || '');
  let keywords;
  if (Array.isArray(topic.keywords) && topic.keywords.length) {
    keywords = topic.keywords.map((k) => String(k).trim()).filter(Boolean);
  } else {
    keywords = extractKeywordsFromText(topic.title);
  }
  return {
    id: topic.id,
    title: topic.title,
    taskType: topic.type,
    subtype: topic.subtype,
    examDate: topic.date,
    promptText,
    keywords,
  };
}
