import fs from 'fs';
import { spawnSync } from 'child_process';

function parseEnv(path) {
  const out = {};
  if (!fs.existsSync(path)) {
    throw new Error(`Missing ${path}`);
  }
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function runVercel(args, input, opts = {}) {
  const result = spawnSync('npx', ['vercel', ...args], {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
  });
  if (result.status !== 0 && !opts.allowFail) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`vercel ${args.join(' ')} failed: ${detail}`);
  }
  return (result.stdout || '').trim();
}

function upsertEnv(name, value, environments) {
  for (const env of environments) {
    runVercel(['env', 'rm', name, env, '--yes'], null, { allowFail: true });
    runVercel(['env', 'add', name, env], value);
    console.log(`Updated ${name} for ${env}`);
  }
}

function removeEnv(name, environments) {
  for (const env of environments) {
    runVercel(['env', 'rm', name, env, '--yes'], null, { allowFail: true });
    console.log(`Removed ${name} from ${env} (if it existed)`);
  }
}

const local = parseEnv('.env.local');
const apiKey = (local.OPENAI_API_KEY || '').trim();
if (!apiKey || apiKey.length < 20) {
  throw new Error('OPENAI_API_KEY is missing or invalid in .env.local');
}

const projectId = (local.OPENAI_PROJECT_ID || '').trim();
const ttsModel = (local.OPENAI_TTS_MODEL || 'tts-1').trim();
const targets = ['production'];

upsertEnv('OPENAI_API_KEY', apiKey, targets);
upsertEnv('OPENAI_TTS_MODEL', ttsModel, targets);

if (projectId) {
  upsertEnv('OPENAI_PROJECT_ID', projectId, targets);
} else {
  removeEnv('OPENAI_PROJECT_ID', targets);
}

console.log('OpenAI env synced from .env.local to Vercel.');
console.log('OPENAI_TTS_MODEL:', ttsModel);
