#!/usr/bin/env node
/**
 * Temporary, zero-dependency HTTP collector for HDBG sessions.
 *
 * Environment:
 *   DEBUG_HOST=127.0.0.1
 *   DEBUG_PORT=9876
 *   DEBUG_IDLE_TIMEOUT=600000
 *   DEBUG_MAX_BODY_BYTES=65536
 *   DEBUG_MAX_EVENTS=2000
 *   DEBUG_MAX_TOTAL_EVENTS=2000
 *   DEBUG_MAX_SESSIONS=50
 */

const http = require('http');
const { randomBytes } = require('crypto');

function readPositiveInt(name, fallback, allowZero) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    console.error(`[ERROR] ${name} must be ${allowZero ? 'a non-negative' : 'a positive'} integer.`);
    process.exit(1);
  }
  return value;
}

const HOST = process.env.DEBUG_HOST || '127.0.0.1';
const PORT = readPositiveInt('DEBUG_PORT', 9876, true);
const IDLE_TIMEOUT = readPositiveInt('DEBUG_IDLE_TIMEOUT', 10 * 60 * 1000, false);
const MAX_BODY_BYTES = readPositiveInt('DEBUG_MAX_BODY_BYTES', 64 * 1024, false);
const MAX_EVENTS = readPositiveInt('DEBUG_MAX_EVENTS', 2000, false);
const MAX_TOTAL_EVENTS = readPositiveInt('DEBUG_MAX_TOTAL_EVENTS', 2000, false);
const MAX_SESSIONS = readPositiveInt('DEBUG_MAX_SESSIONS', 50, false);

const logs = new Map();
const nextSequence = new Map();
const droppedBySession = new Map();
const arrivalOrder = Symbol('arrivalOrder');
const startTime = Date.now();
let lastRequestTime = Date.now();
let closing = false;
let nextArrivalOrder = 1;
let totalEvents = 0;

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function generateId() {
  return `log_${Date.now()}_${randomBytes(3).toString('hex')}`;
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let rejected = false;

    req.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        rejected = true;
        reject(new RequestError(413, `Request body exceeds ${MAX_BODY_BYTES} bytes`));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (rejected) return;
      const raw = Buffer.concat(chunks).toString('utf8');
      const contentType = String(req.headers['content-type'] || '')
        .split(';', 1)[0]
        .trim()
        .toLowerCase();

      if (contentType === 'application/json') {
        try {
          resolve({ kind: 'json', value: raw ? JSON.parse(raw) : {} });
        } catch {
          reject(new RequestError(400, 'Invalid JSON'));
        }
        return;
      }

      resolve({ kind: 'text', value: raw });
    });

    req.on('error', reject);
  });
}

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function queryOrBody(url, key, body, aliases) {
  const queryValue = url.searchParams.get(key);
  if (queryValue !== null && queryValue !== '') return queryValue;
  if (body.kind !== 'json' || body.value === null || typeof body.value !== 'object') {
    return undefined;
  }
  for (const alias of aliases) {
    if (body.value[alias] !== undefined && body.value[alias] !== null) {
      return body.value[alias];
    }
  }
  return undefined;
}

function extractJsonData(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
  if (Object.prototype.hasOwnProperty.call(value, 'data')) return value.data;
  return value;
}

function deleteSession(session) {
  const entries = logs.get(session) || [];
  totalEvents -= entries.length;
  logs.delete(session);
  nextSequence.delete(session);
  droppedBySession.delete(session);
}

function ensureSession(session) {
  if (logs.has(session)) return logs.get(session);

  if (logs.size >= MAX_SESSIONS) {
    const oldest = logs.keys().next().value;
    if (oldest !== undefined) {
      deleteSession(oldest);
    }
  }

  const entries = [];
  logs.set(session, entries);
  nextSequence.set(session, 1);
  droppedBySession.set(session, 0);
  return entries;
}

function appendEntry(session, entry) {
  const entries = ensureSession(session);
  entry[arrivalOrder] = nextArrivalOrder;
  nextArrivalOrder += 1;
  entries.push(entry);
  totalEvents += 1;
  if (entries.length > MAX_EVENTS) {
    const removed = entries.splice(0, entries.length - MAX_EVENTS).length;
    totalEvents -= removed;
    droppedBySession.set(session, (droppedBySession.get(session) || 0) + removed);
  }

  while (totalEvents > MAX_TOTAL_EVENTS) {
    let oldestSession;
    let oldestOrder = Number.POSITIVE_INFINITY;
    for (const [candidateSession, candidateEntries] of logs) {
      const first = candidateEntries[0];
      if (first && first[arrivalOrder] < oldestOrder) {
        oldestSession = candidateSession;
        oldestOrder = first[arrivalOrder];
      }
    }
    if (oldestSession === undefined) break;
    logs.get(oldestSession).shift();
    totalEvents -= 1;
    droppedBySession.set(
      oldestSession,
      (droppedBySession.get(oldestSession) || 0) + 1,
    );
  }
}

function buildEntry(url, body) {
  const session = String(queryOrBody(url, 's', body, ['session']) || 'default');
  const runtime = queryOrBody(url, 'r', body, ['runtime']) || 'unknown';
  const event = queryOrBody(url, 'e', body, ['event', 'type']) || 'log';
  ensureSession(session);
  const sequence = nextSequence.get(session) || 1;
  const envelope = body.kind === 'json' && body.value && typeof body.value === 'object'
    ? body.value
    : {};

  const entry = {
    id: generateId(),
    seq: sequence,
    ts: Date.now(),
    runtime,
    event,
    fn: envelope.fn || envelope.function,
    file: envelope.file,
    line: envelope.line,
    correlation: envelope.correlation || envelope.correlationId,
    data: body.kind === 'json' ? extractJsonData(body.value) : body.value,
    msg: envelope.msg || envelope.message,
  };

  nextSequence.set(session, sequence + 1);
  Object.keys(entry).forEach((key) => entry[key] === undefined && delete entry[key]);
  return { session, entry };
}

function filteredLogs(url, entries) {
  let result = entries;
  const event = url.searchParams.get('event') || url.searchParams.get('type');
  const runtime = url.searchParams.get('runtime');
  const fn = url.searchParams.get('fn');
  const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '0', 10);

  if (event) result = result.filter(entry => entry.event === event);
  if (runtime) result = result.filter(entry => entry.runtime === runtime);
  if (fn) result = result.filter(entry => entry.fn === fn);
  if (Number.isFinite(parsedLimit) && parsedLimit > 0) result = result.slice(-parsedLimit);
  return result;
}

async function handleRequest(req, res) {
  lastRequestTime = Date.now();

  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const pathname = url.pathname;
    const method = req.method;

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    if (method === 'POST' && pathname === '/log') {
      const body = await parseBody(req);
      const { session, entry } = buildEntry(url, body);
      appendEntry(session, entry);
      console.log(`[${new Date(entry.ts).toISOString()}] [${session}] #${entry.seq} ${entry.event}`);
      sendJson(res, { id: entry.id, session, seq: entry.seq }, 201);
      return;
    }

    if (method === 'GET' && pathname === '/sessions') {
      const sessions = [];
      for (const [id, entries] of logs) {
        sessions.push({
          id,
          count: entries.length,
          dropped: droppedBySession.get(id) || 0,
          firstAt: entries[0] && entries[0].ts,
          lastAt: entries[entries.length - 1] && entries[entries.length - 1].ts,
        });
      }
      sendJson(res, { sessions });
      return;
    }

    const logsMatch = pathname.match(/^\/logs\/([^/]+)$/);
    if (logsMatch && method === 'GET') {
      const session = decodeURIComponent(logsMatch[1]);
      const entries = filteredLogs(url, logs.get(session) || []);
      sendJson(res, {
        session,
        count: entries.length,
        dropped: droppedBySession.get(session) || 0,
        logs: entries,
      });
      return;
    }

    if (logsMatch && method === 'DELETE') {
      const session = decodeURIComponent(logsMatch[1]);
      const count = (logs.get(session) || []).length;
      deleteSession(session);
      sendJson(res, { session, deleted: count });
      return;
    }

    if (method === 'DELETE' && pathname === '/shutdown') {
      sendJson(res, { message: 'Shutting down' });
      setImmediate(() => shutdown('explicit request'));
      return;
    }

    if (method === 'GET' && pathname === '/') {
      sendJson(res, {
        name: 'HDBG Collector',
        version: '2.0.0',
        host: HOST,
        port: server.address() && server.address().port,
        uptime: Math.floor((Date.now() - startTime) / 1000),
        totalLogs: totalEvents,
        sessions: logs.size,
        limits: {
          maxBodyBytes: MAX_BODY_BYTES,
          maxEvents: MAX_EVENTS,
          maxTotalEvents: MAX_TOTAL_EVENTS,
          maxSessions: MAX_SESSIONS,
        },
      });
      return;
    }

    sendJson(res, { error: 'Not Found', path: pathname }, 404);
  } catch (error) {
    const status = error instanceof RequestError ? error.status : 400;
    sendJson(res, { error: error.message }, status);
  }
}

const server = http.createServer(handleRequest);

function shutdown(reason) {
  if (closing) return;
  closing = true;
  clearInterval(idleChecker);
  console.log(`[HDBG] Stopping collector: ${reason}`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
}

const idleCheckInterval = Math.max(50, Math.min(30000, Math.floor(IDLE_TIMEOUT / 2)));
const idleChecker = setInterval(() => {
  if (Date.now() - lastRequestTime >= IDLE_TIMEOUT) shutdown('idle timeout');
}, idleCheckInterval);
idleChecker.unref();

server.on('error', (error) => {
  clearInterval(idleChecker);
  console.error(`[ERROR] Failed to start collector on ${HOST}:${PORT}: ${error.message}`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const address = server.address();
  const actualPort = address && address.port;
  const endpoint = `http://${HOST}:${actualPort}`;
  console.log(`HDBG_COLLECTOR_READY ${JSON.stringify({
    host: HOST,
    port: actualPort,
    endpoint,
  })}`);
  console.log(`[HDBG] Collector ready at ${endpoint}; idle timeout ${IDLE_TIMEOUT}ms`);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
