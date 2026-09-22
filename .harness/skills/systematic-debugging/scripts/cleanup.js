#!/usr/bin/env node
/**
 * Remove one HDBG session without touching other sessions or generic DEBUG code.
 *
 * Usage:
 *   node cleanup.js --session 7kx2 --root /project
 *   node cleanup.js --session 7kx2 --root /project --check
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const EXCLUDED_DIRS = new Set([
  '.git',
  '.harness',
  '.agents',
  '.codex',
  'openspec',
  'node_modules',
  'dist',
  'build',
  '.next',
  'out',
  'target',
]);
const MAX_SCAN_BYTES = 5 * 1024 * 1024;

function usage() {
  console.log([
    'Usage: node cleanup.js --session <id> [--root <path>] [--manifest <path>]',
    '                       [--endpoint <url>] [--check] [--no-shutdown]',
  ].join('\n'));
}

function parseArgs(argv) {
  const options = {
    root: process.cwd(),
    endpoint: process.env.HDBG_ENDPOINT
      || `http://127.0.0.1:${process.env.DEBUG_PORT || '9876'}`,
    check: false,
    shutdown: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--no-shutdown') {
      options.shutdown = false;
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else if (['--session', '--root', '--manifest', '--endpoint'].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      options[arg.slice(2)] = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!options.session) throw new Error('--session is required');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(options.session)) {
    throw new Error('--session must contain only letters, digits, _ or - (max 64)');
  }

  options.root = path.resolve(options.root);
  if (!fs.existsSync(options.root) || !fs.statSync(options.root).isDirectory()) {
    throw new Error(`Root is not a directory: ${options.root}`);
  }
  options.realRoot = fs.realpathSync.native(options.root);
  options.manifest = path.resolve(
    options.manifest
      || path.join(options.root, '.harness', '.debug', `${options.session}.json`),
  );
  return options;
}

function isWithinRoot(root, target) {
  const relative = path.relative(root, target);
  return relative === ''
    || (!relative.startsWith(`..${path.sep}`)
      && relative !== '..'
      && !path.isAbsolute(relative));
}

function assertSafeExistingPath(options, target, label) {
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing ${label} symlink: ${target}`);
  }
  const realTarget = fs.realpathSync.native(target);
  if (!isWithinRoot(options.realRoot, realTarget)) {
    throw new Error(`${label} path resolves outside root: ${target}`);
  }
  return stat;
}

function resolveInsideRoot(options, candidate, label) {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    throw new Error(`Invalid ${label} path in manifest`);
  }
  const resolved = path.resolve(options.root, candidate);
  if (!isWithinRoot(options.root, resolved)) {
    throw new Error(`${label} path escapes root: ${candidate}`);
  }
  if (fs.existsSync(resolved)) assertSafeExistingPath(options, resolved, label);
  return resolved;
}

function readManifest(options) {
  if (!fs.existsSync(options.manifest)) return undefined;
  if (!isWithinRoot(options.root, options.manifest)) {
    throw new Error(`Manifest escapes root: ${options.manifest}`);
  }
  assertSafeExistingPath(options, options.manifest, 'manifest');

  const manifest = JSON.parse(fs.readFileSync(options.manifest, 'utf8'));
  if (manifest.session !== options.session) {
    throw new Error(`Manifest session mismatch: ${manifest.session}`);
  }
  if (manifest.root && path.resolve(manifest.root) !== options.root) {
    throw new Error(`Manifest root mismatch: ${manifest.root}`);
  }

  return {
    files: (manifest.files || []).map(
      file => resolveInsideRoot(options, file, 'file'),
    ),
    helpers: (manifest.helpers || []).map(
      file => resolveInsideRoot(options, file, 'helper'),
    ),
  };
}

function readTextIfSmall(filePath, options, label, strict = false) {
  const stat = assertSafeExistingPath(options, filePath, label);
  if (!stat.isFile()) {
    if (strict) throw new Error(`${label} is not a regular file: ${filePath}`);
    return undefined;
  }
  if (stat.size > MAX_SCAN_BYTES) {
    if (strict) throw new Error(`${label} exceeds ${MAX_SCAN_BYTES} scan bytes: ${filePath}`);
    return undefined;
  }
  const content = fs.readFileSync(filePath);
  if (content.includes(0)) {
    if (strict) throw new Error(`${label} appears to be binary: ${filePath}`);
    return undefined;
  }
  return content.toString('utf8');
}

function markerTokens(session) {
  return [
    `/*HDBG:${session}*/`,
    `/*HDBG:${session}:B*/`,
    `/*HDBG:${session}:E*/`,
  ];
}

function hasSessionMarker(content, session) {
  return markerTokens(session).some(marker => content.includes(marker));
}

function fileHasSessionMarker(filePath, session, options) {
  const stat = assertSafeExistingPath(options, filePath, 'scanned file');
  if (!stat.isFile()) return false;
  if (stat.size <= MAX_SCAN_BYTES) {
    const content = readTextIfSmall(filePath, options, 'scanned file');
    return content !== undefined && hasSessionMarker(content, session);
  }

  const needles = markerTokens(session).map(marker => Buffer.from(marker));
  const overlap = Math.max(...needles.map(needle => needle.length)) - 1;
  const chunk = Buffer.allocUnsafe(64 * 1024);
  const descriptor = fs.openSync(filePath, 'r');
  let carry = Buffer.alloc(0);
  try {
    while (true) {
      const bytesRead = fs.readSync(descriptor, chunk, 0, chunk.length, null);
      if (bytesRead === 0) return false;
      const window = Buffer.concat([carry, chunk.subarray(0, bytesRead)]);
      if (needles.some(needle => window.includes(needle))) return true;
      carry = window.subarray(Math.max(0, window.length - overlap));
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

function findMarkedFiles(root, session, options) {
  const matches = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) walk(filePath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (fileHasSessionMarker(filePath, session, options)) matches.push(filePath);
    }
  }

  walk(root);
  return matches;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeSessionMarkers(content, session) {
  const escaped = escapeRegex(session);
  const block = new RegExp(
    `^[\\t ]*\\/\\*HDBG:${escaped}:B\\*\\/[\\s\\S]*?`
      + `^[\\t ]*\\/\\*HDBG:${escaped}:E\\*\\/[\\t ]*(?:\\r?\\n|$)`,
    'gm',
  );
  const line = new RegExp(
    `^[\\t ]*\\/\\*HDBG:${escaped}\\*\\/[^\\r\\n]*(?:\\r?\\n|$)`,
    'gm',
  );
  return content.replace(block, '').replace(line, '');
}

function isManagedHelperContent(content, session) {
  const escaped = escapeRegex(session);
  return new RegExp(
    `^\\s*\\/\\*HDBG:${escaped}:B\\*\\/[\\s\\S]*`
      + `\\/\\*HDBG:${escaped}:E\\*\\/\\s*$`,
  ).test(content);
}

function cleanFile(filePath, options, session, strict = false) {
  if (!fs.existsSync(filePath)) return false;
  const content = readTextIfSmall(filePath, options, 'source file', strict);
  if (content === undefined || !hasSessionMarker(content, session)) return false;
  const cleaned = removeSessionMarkers(content, session);
  if (cleaned === content) return false;
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log(`[HDBG] Cleaned ${filePath}`);
  return true;
}

function removeHelper(filePath, options, session) {
  if (!fs.existsSync(filePath)) return false;
  const content = readTextIfSmall(filePath, options, 'helper', true);
  if (!isManagedHelperContent(content, session)) {
    const cleaned = removeSessionMarkers(content, session);
    if (cleaned !== content) {
      fs.writeFileSync(filePath, cleaned, 'utf8');
      console.log(`[HDBG] Cleaned helper block in ${filePath}`);
      return true;
    }
    throw new Error(`Refusing to delete unmarked helper: ${filePath}`);
  }
  fs.unlinkSync(filePath);
  console.log(`[HDBG] Removed helper ${filePath}`);
  return true;
}

function remainingArtifacts(options, manifest) {
  const markedFiles = findMarkedFiles(options.root, options.session, options);
  const helpers = manifest
    ? manifest.helpers.filter(file => fs.existsSync(file))
    : [];
  const manifestFiles = fs.existsSync(options.manifest) ? [options.manifest] : [];
  return [...new Set([...markedFiles, ...helpers, ...manifestFiles])];
}

function removeEmptyManifestDir(manifestPath) {
  const directory = path.dirname(manifestPath);
  try {
    if (fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
  } catch {
    // The directory may be shared, absent, or non-empty.
  }
}

function shutdownCollector(endpoint) {
  return new Promise((resolve) => {
    let target;
    try {
      target = new URL(`${endpoint.replace(/\/$/, '')}/shutdown`);
    } catch {
      console.log(`[HDBG] Collector endpoint is invalid; skipped shutdown: ${endpoint}`);
      resolve();
      return;
    }

    const request = http.request(target, { method: 'DELETE', timeout: 300 }, (response) => {
      response.resume();
      response.on('end', resolve);
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => resolve());
    request.end();
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  activeOptions = options;

  try {
    const manifest = readManifest(options);

    if (options.check) {
      const remnants = remainingArtifacts(options, manifest);
      if (remnants.length > 0) {
        console.error(`[HDBG] Session ${options.session} still has ${remnants.length} artifact(s):`);
        remnants.forEach(file => console.error(`  ${file}`));
        process.exitCode = 1;
        return;
      }
      console.log(`[HDBG] Session ${options.session} has no remaining artifacts.`);
      return;
    }

    if (manifest) {
      for (const helper of manifest.helpers) removeHelper(helper, options, options.session);
      for (const file of manifest.files) cleanFile(file, options, options.session, true);
    }

    for (const file of findMarkedFiles(options.root, options.session, options)) {
      const content = readTextIfSmall(file, options, 'marked file');
      if (content !== undefined && isManagedHelperContent(content, options.session)) {
        removeHelper(file, options, options.session);
      } else {
        cleanFile(file, options, options.session);
      }
    }

    const remainingMarkers = findMarkedFiles(options.root, options.session, options);
    if (remainingMarkers.length > 0) {
      throw new Error(`Unable to clean session markers from: ${remainingMarkers.join(', ')}`);
    }

    if (fs.existsSync(options.manifest)) {
      assertSafeExistingPath(options, options.manifest, 'manifest');
      fs.unlinkSync(options.manifest);
      removeEmptyManifestDir(options.manifest);
      console.log(`[HDBG] Removed manifest ${options.manifest}`);
    }

    console.log(`[HDBG] Session ${options.session} cleanup complete.`);
  } finally {
    if (!options.check && options.shutdown) await shutdownActiveCollector();
  }
}

let activeOptions;
let shutdownPromise;

function shutdownActiveCollector() {
  if (!activeOptions || !activeOptions.shutdown) return Promise.resolve();
  if (!shutdownPromise) shutdownPromise = shutdownCollector(activeOptions.endpoint);
  return shutdownPromise;
}

async function exitAfterSignal(signal) {
  console.error(`[HDBG] Cleanup interrupted by ${signal}.`);
  await shutdownActiveCollector();
  process.exit(signal === 'SIGINT' ? 130 : 143);
}

process.once('SIGINT', () => void exitAfterSignal('SIGINT'));
process.once('SIGTERM', () => void exitAfterSignal('SIGTERM'));

main().catch((error) => {
  console.error(`[HDBG] Cleanup failed: ${error.message}`);
  process.exitCode = 1;
});
