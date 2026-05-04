#!/usr/bin/env node
"use strict";

const { execSync } = require("node:child_process");

function toInt(value) {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function exec(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
}

function pidsOnPortWindows(port) {
  // netstat example line:
  // TCP    0.0.0.0:3000    0.0.0.0:0     LISTENING       12345
  const out = exec(`netstat -ano -p TCP | findstr /R /C:":${port} "`);
  const pids = [];
  for (const line of out.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!/\sLISTENING\s/i.test(trimmed)) continue;
    const parts = trimmed.split(/\s+/);
    const pid = toInt(parts[parts.length - 1]);
    if (pid) pids.push(pid);
  }
  return uniq(pids);
}

function pidsOnPortUnix(port) {
  // lsof exits non-zero when no match; caller handles.
  const out = exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`);
  const pids = out
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(toInt)
    .filter(Boolean);
  return uniq(pids);
}

function killPidWindows(pid) {
  exec(`taskkill /PID ${pid} /T /F`);
}

function killPidUnix(pid) {
  // Prefer graceful, then force.
  try {
    exec(`kill -TERM ${pid}`);
  } catch {
    // ignore
  }
  try {
    exec(`kill -KILL ${pid}`);
  } catch {
    // ignore
  }
}

function main() {
  const rawPort = process.argv[2] ?? process.env.PORT ?? "3000";
  const port = toInt(rawPort);
  if (!port || port < 1 || port > 65535) {
    console.error(`Invalid port: ${rawPort}`);
    process.exit(2);
  }

  const isWin = process.platform === "win32";

  let pids = [];
  try {
    pids = isWin ? pidsOnPortWindows(port) : pidsOnPortUnix(port);
  } catch {
    // No process found (or tool missing) → do not fail dev startup.
    process.exit(0);
  }

  if (pids.length === 0) process.exit(0);

  for (const pid of pids) {
    try {
      if (isWin) killPidWindows(pid);
      else killPidUnix(pid);
      // eslint-disable-next-line no-console
      console.log(`Killed PID ${pid} on port ${port}`);
    } catch (e) {
      console.warn(`Failed to kill PID ${pid} on port ${port}: ${e?.message ?? e}`);
    }
  }
}

main();

