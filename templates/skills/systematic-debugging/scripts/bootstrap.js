#!/usr/bin/env node
/**
 * Start the temporary HDBG collector with environment-based configuration.
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, 'debug-server.js');
const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);

if (nodeMajor < 14) {
  console.error('HDBG collector requires Node.js 14 or higher.');
  process.exit(1);
}

const env = {
  ...process.env,
  DEBUG_HOST: process.env.DEBUG_HOST || '127.0.0.1',
  DEBUG_PORT: process.env.DEBUG_PORT || '9876',
};

console.log(`[HDBG] Starting collector from ${serverPath}`);
const server = spawn(process.execPath, [serverPath], {
  stdio: 'inherit',
  env,
});

server.on('error', (error) => {
  console.error(`[HDBG] Failed to start collector: ${error.message}`);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (signal) process.exit(0);
  process.exitCode = code === null ? 1 : code;
});

function forward(signal) {
  if (!server.killed) server.kill(signal);
}

process.on('SIGINT', () => forward('SIGINT'));
process.on('SIGTERM', () => forward('SIGTERM'));
