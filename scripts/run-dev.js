#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const root = path.join(__dirname, "..");
const port = process.argv[2] ?? "3000";

function cleanedEnv() {
  const env = { ...process.env };
  const ca = env.NODE_EXTRA_CA_CERTS;
  if (!ca || !String(ca).trim()) return env;
  try {
    if (!fs.existsSync(ca)) {
      delete env.NODE_EXTRA_CA_CERTS;
      console.warn(
        `[dev] NODE_EXTRA_CA_CERTS points to a missing file (${ca}); unset for this Next.js process. Fix: remove the variable or set it to a real PEM path.`
      );
    }
  } catch {
    delete env.NODE_EXTRA_CA_CERTS;
  }
  return env;
}

const killPort = path.join(root, "kill-port.js");
const killResult = spawnSync(process.execPath, [killPort, port], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
if (killResult.status !== 0 && killResult.status !== null) {
  process.exit(killResult.status);
}

const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextCli)) {
  console.error("Next.js CLI not found under node_modules. Run npm install.");
  process.exit(1);
}

const child = spawn(process.execPath, [nextCli, "dev", "-p", port], {
  cwd: root,
  stdio: "inherit",
  env: cleanedEnv(),
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
