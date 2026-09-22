import { afterEach, describe, expect, it } from 'vitest'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import vm from 'node:vm'

const skillDir = path.join(
  process.cwd(),
  'templates',
  'skills',
  'systematic-debugging',
)
const collectorScript = path.join(skillDir, 'scripts', 'debug-server.js')
const cleanupScript = path.join(skillDir, 'scripts', 'cleanup.js')
const requireFromTest = createRequire(import.meta.url)

interface CollectorHandle {
  child: ReturnType<typeof spawn>
  endpoint: string
  stop: () => Promise<void>
}

interface LogEntry {
  seq: number
  runtime?: string
  event: string
  data?: unknown
}

interface LogsResponse {
  session: string
  count: number
  dropped: number
  logs: LogEntry[]
}

const activeCollectors = new Set<CollectorHandle>()

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
  })
}

async function waitForExit(child: ReturnType<typeof spawn>, ms = 3000): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return
  await Promise.race([once(child, 'exit').then(() => undefined), timeout(ms)])
}

async function startCollector(
  env: Record<string, string> = {},
): Promise<CollectorHandle> {
  const child = spawn(process.execPath, [collectorScript], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DEBUG_HOST: '127.0.0.1',
      DEBUG_PORT: '0',
      DEBUG_IDLE_TIMEOUT: '10000',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let stderr = ''
  child.stderr?.setEncoding('utf-8')
  child.stderr?.on('data', chunk => stderr += chunk)

  const ready = new Promise<string>((resolve, reject) => {
    const lines = readline.createInterface({ input: child.stdout! })
    lines.on('line', (line) => {
      if (!line.startsWith('HDBG_COLLECTOR_READY ')) return
      const info = JSON.parse(line.slice('HDBG_COLLECTOR_READY '.length)) as {
        endpoint: string
      }
      resolve(info.endpoint)
    })
    child.once('exit', (code) => reject(new Error(
      `Collector exited before ready (${code}): ${stderr}`,
    )))
    child.once('error', reject)
  })

  const endpoint = await Promise.race([ready, timeout(3000)])
  const handle: CollectorHandle = {
    child,
    endpoint,
    stop: async () => {
      if (child.exitCode !== null || child.signalCode !== null) return
      try {
        await fetch(`${endpoint}/shutdown`, { method: 'DELETE' })
        await waitForExit(child)
      } catch {
        child.kill('SIGTERM')
        await waitForExit(child)
      }
    },
  }
  activeCollectors.add(handle)
  child.once('exit', () => activeCollectors.delete(handle))
  return handle
}

async function readLogs(endpoint: string, session: string): Promise<LogsResponse> {
  const response = await fetch(`${endpoint}/logs/${encodeURIComponent(session)}`)
  expect(response.status).toBe(200)
  return await response.json() as LogsResponse
}

function childDirectories(directory: string): string[] {
  try {
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter(entry => entry.isDirectory() || entry.isSymbolicLink())
      .map(entry => path.join(directory, entry.name))
  } catch {
    return []
  }
}

function javaHomes(): string[] {
  const homes = new Set<string>()
  for (const value of [
    process.env.JAVA_HOME,
    process.env.JAVA8_HOME,
    process.env.JAVA17_HOME,
    process.env.JAVA21_HOME,
  ]) {
    if (value) homes.add(value)
  }

  for (const candidate of childDirectories(path.join(os.homedir(), '.sdkman', 'candidates', 'java'))) {
    homes.add(candidate)
  }
  for (const candidate of childDirectories('/Library/Java/JavaVirtualMachines')) {
    homes.add(path.join(candidate, 'Contents', 'Home'))
  }
  return [...homes].filter(home => fs.existsSync(path.join(home, 'bin', 'java')))
}

function javaMajor(home: string): number | undefined {
  const result = spawnSync(path.join(home, 'bin', 'java'), ['-version'], { encoding: 'utf-8' })
  const output = `${result.stdout || ''}\n${result.stderr || ''}`
  const match = output.match(/version "(?:1\.)?(\d+)/)
  return match ? Number.parseInt(match[1], 10) : undefined
}

function findJavaHome(major: number): string | undefined {
  return javaHomes().find(home => javaMajor(home) === major)
}

afterEach(async () => {
  await Promise.all([...activeCollectors].map(collector => collector.stop()))
  activeCollectors.clear()
})

describe.sequential('systematic debugging', () => {
  describe('collector', () => {
    it('accepts JSON and text events with isolated ordered sessions', async () => {
      const collector = await startCollector()

      const jsonResponse = await fetch(`${collector.endpoint}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: 'json-session',
          runtime: 'node',
          event: 'save:before',
          data: { id: 42 },
        }),
      })
      expect(jsonResponse.status).toBe(201)

      const secondJsonResponse = await fetch(
        `${collector.endpoint}/log?s=json-session&r=node&e=save%3Aafter`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result: 'ok' }),
        },
      )
      expect(secondJsonResponse.status).toBe(201)

      const textResponse = await fetch(
        `${collector.endpoint}/log?s=java-session&r=java&e=save%3Abefore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: 'id=42,state=SAVING',
        },
      )
      expect(textResponse.status).toBe(201)

      const jsonLogs = await readLogs(collector.endpoint, 'json-session')
      expect(jsonLogs.logs).toMatchObject([
        { seq: 1, runtime: 'node', event: 'save:before', data: { id: 42 } },
        { seq: 2, runtime: 'node', event: 'save:after', data: { result: 'ok' } },
      ])

      const javaLogs = await readLogs(collector.endpoint, 'java-session')
      expect(javaLogs.logs).toMatchObject([
        { seq: 1, runtime: 'java', event: 'save:before', data: 'id=42,state=SAVING' },
      ])

      const status = await fetch(collector.endpoint).then(
        response => response.json() as Promise<{
          host: string
          port: number
          limits: { maxEvents: number }
        }>,
      )
      expect(status.host).toBe('127.0.0.1')
      expect(status.port).toBeGreaterThan(0)
      expect(status.limits.maxEvents).toBe(2000)
    })

    it('bounds request bodies and keeps a per-session ring buffer', async () => {
      const collector = await startCollector({
        DEBUG_MAX_BODY_BYTES: '64',
        DEBUG_MAX_EVENTS: '2',
      })

      for (const event of ['one', 'two', 'three']) {
        const response = await fetch(
          `${collector.endpoint}/log?s=bounded&r=test&e=${event}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: event,
          },
        )
        expect(response.status).toBe(201)
      }

      const oversized = await fetch(`${collector.endpoint}/log?s=bounded`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'x'.repeat(65),
      })
      expect(oversized.status).toBe(413)

      const logs = await readLogs(collector.endpoint, 'bounded')
      expect(logs.dropped).toBe(1)
      expect(logs.logs.map(entry => [entry.seq, entry.event])).toEqual([
        [2, 'two'],
        [3, 'three'],
      ])
    })

    it('preserves direct JSON data and enforces a global event budget', async () => {
      const collector = await startCollector({
        DEBUG_MAX_EVENTS: '10',
        DEBUG_MAX_TOTAL_EVENTS: '2',
      })

      await fetch(`${collector.endpoint}/log?s=oldest&e=first`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 1 }),
      })
      await fetch(`${collector.endpoint}/log?s=kept&r=node&e=reserved-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runtime: 'business-runtime',
          message: 'business-message',
        }),
      })
      await fetch(`${collector.endpoint}/log?s=kept&r=node&e=last`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: 3 }),
      })

      const oldest = await readLogs(collector.endpoint, 'oldest')
      expect(oldest.logs).toEqual([])
      expect(oldest.dropped).toBe(1)

      const kept = await readLogs(collector.endpoint, 'kept')
      expect(kept.logs).toMatchObject([
        {
          runtime: 'node',
          event: 'reserved-fields',
          data: {
            runtime: 'business-runtime',
            message: 'business-message',
          },
        },
        { runtime: 'node', event: 'last', data: { value: 3 } },
      ])

      const status = await fetch(collector.endpoint).then(
        response => response.json() as Promise<{
          totalLogs: number
          limits: { maxTotalEvents: number }
        }>,
      )
      expect(status.totalLogs).toBe(2)
      expect(status.limits.maxTotalEvents).toBe(2)
    })

    it('exits after the configured idle timeout', async () => {
      const collector = await startCollector({ DEBUG_IDLE_TIMEOUT: '150' })
      await waitForExit(collector.child, 2000)
      expect(collector.child.exitCode).toBe(0)
    })
  })

  describe('emitters', () => {
    it('sends Browser and Electron renderer/preload events through direct HTTP', async () => {
      const collector = await startCollector()
      const template = fs.readFileSync(path.join(skillDir, 'assets', 'hdbg-web.js'), 'utf-8')

      for (const runtime of ['browser', 'electron-renderer', 'electron-preload']) {
        const session = `${runtime}-session`
        const source = template
          .replaceAll('__HDBG_ENDPOINT__', collector.endpoint)
          .replaceAll('__HDBG_SESSION__', session)
          .replaceAll('__HDBG_RUNTIME__', runtime)
        const context = vm.createContext({
          fetch,
          AbortController,
          setTimeout,
          clearTimeout,
        })
        vm.runInContext(source, context)
        const emitter = context.__hdbg as (
          event: string,
          data: unknown,
        ) => Promise<unknown>
        await emitter('smoke', { runtime })

        const logs = await readLogs(collector.endpoint, session)
        expect(logs.logs).toMatchObject([
          { seq: 1, runtime, event: 'smoke', data: { runtime } },
        ])
      }

      const electronReference = fs.readFileSync(
        path.join(skillDir, 'references', 'javascript-http.md'),
        'utf-8',
      )
      expect(electronReference).toContain('renderer 与 preload 优先使用 Web 模板直连 collector')
      expect(electronReference).toContain('renderer/preload --IPC(debug-event)--> main --HTTP--> collector')
      expect(electronReference).not.toContain('webSecurity: false')
    })

    it('keeps Browser probes fail-open when serialization or HTTP stalls', async () => {
      const template = fs.readFileSync(path.join(skillDir, 'assets', 'hdbg-web.js'), 'utf-8')
      const source = template
        .replaceAll('__HDBG_ENDPOINT__', 'http://127.0.0.1:1')
        .replaceAll('__HDBG_SESSION__', 'browser-fail-open')
        .replaceAll('__HDBG_RUNTIME__', 'browser')
      const hangingFetch = (_url: string, init?: RequestInit): Promise<Response> => (
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
        })
      )
      const context = vm.createContext({
        fetch: hangingFetch,
        AbortController,
        setTimeout,
        clearTimeout,
      })
      vm.runInContext(source, context)
      const emitter = context.__hdbg as (
        event: string,
        data: unknown,
      ) => Promise<unknown>

      await Promise.race([emitter('stalled', { value: 1 }), timeout(1000)])
      const circular: Record<string, unknown> = {}
      circular.self = circular
      await expect(emitter('circular', circular)).resolves.toBeUndefined()
    })

    it('sends Node.js and Electron main events through node:http semantics', async () => {
      const collector = await startCollector()
      const template = fs.readFileSync(path.join(skillDir, 'assets', 'hdbg-node.cjs'), 'utf-8')

      for (const runtime of ['node', 'electron-main']) {
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hdbg-node-'))
        try {
          const session = `${runtime}-session`
          const helper = path.join(tempDir, 'hdbg.cjs')
          fs.writeFileSync(
            helper,
            template
              .replaceAll('__HDBG_ENDPOINT__', collector.endpoint)
              .replaceAll('__HDBG_SESSION__', session)
              .replaceAll('__HDBG_RUNTIME__', runtime),
            'utf-8',
          )
          const emitter = requireFromTest(helper) as (
            event: string,
            data: unknown,
          ) => Promise<unknown>
          await emitter('smoke', { runtime })

          const logs = await readLogs(collector.endpoint, session)
          expect(logs.logs).toMatchObject([
            { seq: 1, runtime, event: 'smoke', data: { runtime } },
          ])
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      }
    })

    const java8Home = findJavaHome(8)
    const modernJavaHome = javaHomes()
      .map(home => ({ home, major: javaMajor(home) }))
      .find(candidate => candidate.major !== undefined && candidate.major >= 17)?.home

    it.runIf(Boolean(java8Home && modernJavaHome))(
      'compiles at the Java 8 API level and reports from Java 8 and a modern LTS JVM',
      async () => {
        const collector = await startCollector()
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hdbg-java-'))
        const source = fs.readFileSync(path.join(skillDir, 'assets', 'Hdbg.java'), 'utf-8')
          .replaceAll('__HDBG_ENDPOINT__', collector.endpoint)
          .replaceAll('__HDBG_SESSION__', 'java-default')

        try {
          fs.writeFileSync(path.join(tempDir, 'Hdbg.java'), source, 'utf-8')
          fs.writeFileSync(path.join(tempDir, 'HdbgDriver.java'), `
public final class HdbgDriver {
    public static void main(String[] args) {
        System.setProperty("hdbg.endpoint", args[0]);
        System.setProperty("hdbg.session", args[1]);
        System.setProperty("hdbg.runtime", args[2]);
        Hdbg.log("smoke", "version=" + System.getProperty("java.version"));
        Hdbg.flush(2000L);
    }
}
`, 'utf-8')

          const runs = [
            {
              home: java8Home!,
              session: 'java8-session',
              runtime: 'java8',
              compilerArgs: ['-source', '8', '-target', '8'],
            },
            {
              home: modernJavaHome!,
              session: 'java-modern-session',
              runtime: 'java-modern',
              compilerArgs: ['--release', '8'],
            },
          ]

          for (const run of runs) {
            const output = path.join(tempDir, run.runtime)
            fs.mkdirSync(output)
            execFileSync(path.join(run.home, 'bin', 'javac'), [
              ...run.compilerArgs,
              '-d',
              output,
              'Hdbg.java',
              'HdbgDriver.java',
            ], { cwd: tempDir, stdio: 'pipe' })
            execFileSync(path.join(run.home, 'bin', 'java'), [
              '-cp',
              output,
              'HdbgDriver',
              collector.endpoint,
              run.session,
              run.runtime,
            ], { cwd: tempDir, stdio: 'pipe' })

            const logs = await readLogs(collector.endpoint, run.session)
            expect(logs.logs).toHaveLength(1)
            expect(logs.logs[0]).toMatchObject({
              seq: 1,
              runtime: run.runtime,
              event: 'smoke',
            })
          }
        } finally {
          fs.rmSync(tempDir, { recursive: true, force: true })
        }
      },
      15000,
    )
  })

  describe('cleanup', () => {
    it('removes only the manifest session and shuts down its collector', async () => {
      const collector = await startCollector()
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hdbg-cleanup-'))
      const sourceDir = path.join(root, 'src')
      const manifestDir = path.join(root, '.harness', '.debug')
      fs.mkdirSync(sourceDir, { recursive: true })
      fs.mkdirSync(manifestDir, { recursive: true })

      const typescriptFile = path.join(sourceDir, 'save.ts')
      const javaFile = path.join(sourceDir, 'Demo.java')
      const helperFile = path.join(sourceDir, 'Hdbg.java')
      const mixedHelperFile = path.join(sourceDir, 'existing.js')
      const manifestFile = path.join(manifestDir, 's1.json')

      try {
        fs.writeFileSync(typescriptFile, [
          'const before = true',
          '/*HDBG:s1*/ __hdbg("save", { before })',
          '// #region DEBUG',
          'const userDebug = true',
          '// #endregion',
          '/*HDBG:s2*/ __hdbg("other", { userDebug })',
          'const after = true',
          '',
        ].join('\n'))
        fs.writeFileSync(javaFile, [
          'final class Demo {',
          '/*HDBG:s1:B*/',
          '    static void temporary() {}',
          '/*HDBG:s1:E*/',
          '    void keep() {}',
          '}',
          '',
        ].join('\n'))
        fs.writeFileSync(helperFile, [
          '/*HDBG:s1:B*/',
          'final class Hdbg {}',
          '/*HDBG:s1:E*/',
          '',
        ].join('\n'))
        fs.writeFileSync(mixedHelperFile, [
          'const keepBefore = true',
          '/*HDBG:s1:B*/',
          'const temporary = true',
          '/*HDBG:s1:E*/',
          'const keepAfter = true',
          '',
        ].join('\n'))
        fs.writeFileSync(manifestFile, JSON.stringify({
          session: 's1',
          root,
          files: ['src/save.ts', 'src/Demo.java'],
          helpers: ['src/Hdbg.java', 'src/existing.js'],
        }, null, 2))

        const cleanup = spawnSync(process.execPath, [
          cleanupScript,
          '--session',
          's1',
          '--root',
          root,
          '--endpoint',
          collector.endpoint,
        ], { encoding: 'utf-8' })
        expect(cleanup.status, cleanup.stderr).toBe(0)
        await waitForExit(collector.child)

        const typescript = fs.readFileSync(typescriptFile, 'utf-8')
        expect(typescript).not.toContain('HDBG:s1')
        expect(typescript).toContain('HDBG:s2')
        expect(typescript).toContain('// #region DEBUG')
        expect(typescript).toContain('const userDebug = true')

        const java = fs.readFileSync(javaFile, 'utf-8')
        expect(java).not.toContain('HDBG:s1')
        expect(java).toContain('void keep()')
        expect(fs.existsSync(helperFile)).toBe(false)
        expect(fs.readFileSync(mixedHelperFile, 'utf-8')).toBe([
          'const keepBefore = true',
          'const keepAfter = true',
          '',
        ].join('\n'))
        expect(fs.existsSync(manifestFile)).toBe(false)

        const check = spawnSync(process.execPath, [
          cleanupScript,
          '--session',
          's1',
          '--root',
          root,
          '--check',
        ], { encoding: 'utf-8' })
        expect(check.status, check.stderr).toBe(0)
      } finally {
        fs.rmSync(root, { recursive: true, force: true })
      }
    })

    it('recovers by exact marker when the manifest is missing', () => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hdbg-recover-'))
      const sourceFile = path.join(root, 'recover.js')
      const helperFile = path.join(root, 'hdbg.js')
      try {
        fs.writeFileSync(sourceFile, [
          'const before = true',
          '/*HDBG:lost*/ __hdbg("lost", { before })',
          '/*HDBG:lost-more*/ __hdbg("other", { before })',
          '',
        ].join('\n'))
        fs.writeFileSync(helperFile, [
          '/*HDBG:lost:B*/',
          'function __hdbg() {}',
          '/*HDBG:lost:E*/',
          '',
        ].join('\n'))

        const dirtyCheck = spawnSync(process.execPath, [
          cleanupScript,
          '--session',
          'lost',
          '--root',
          root,
          '--check',
        ], { encoding: 'utf-8' })
        expect(dirtyCheck.status).toBe(1)
        expect(dirtyCheck.stderr).toContain(sourceFile)

        const cleanup = spawnSync(process.execPath, [
          cleanupScript,
          '--session',
          'lost',
          '--root',
          root,
          '--no-shutdown',
        ], { encoding: 'utf-8' })
        expect(cleanup.status, cleanup.stderr).toBe(0)
        const content = fs.readFileSync(sourceFile, 'utf-8')
        expect(content).not.toContain('/*HDBG:lost*/')
        expect(content).toContain('HDBG:lost-more')
        expect(fs.existsSync(helperFile)).toBe(false)

        const cleanCheck = spawnSync(process.execPath, [
          cleanupScript,
          '--session',
          'lost',
          '--root',
          root,
          '--check',
        ], { encoding: 'utf-8' })
        expect(cleanCheck.status, cleanCheck.stderr).toBe(0)
      } finally {
        fs.rmSync(root, { recursive: true, force: true })
      }
    })

    it('rejects manifest paths outside the project root and still shuts down', async () => {
      const collector = await startCollector()
      const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hdbg-path-'))
      const root = path.join(parent, 'project')
      const manifestDir = path.join(root, '.harness', '.debug')
      const outside = path.join(parent, 'outside.js')
      fs.mkdirSync(manifestDir, { recursive: true })
      fs.writeFileSync(outside, '/*HDBG:path:B*/\nkeep\n/*HDBG:path:E*/\n')
      fs.writeFileSync(path.join(manifestDir, 'path.json'), JSON.stringify({
        session: 'path',
        root,
        files: [],
        helpers: ['../outside.js'],
      }))

      try {
        const cleanup = spawnSync(process.execPath, [
          cleanupScript,
          '--session',
          'path',
          '--root',
          root,
          '--endpoint',
          collector.endpoint,
        ], { encoding: 'utf-8' })
        expect(cleanup.status).toBe(1)
        expect(cleanup.stderr).toContain('escapes root')
        expect(fs.readFileSync(outside, 'utf-8')).toContain('keep')
        await waitForExit(collector.child)
      } finally {
        fs.rmSync(parent, { recursive: true, force: true })
      }
    })

    it.runIf(process.platform !== 'win32')(
      'rejects manifest directory symlinks that resolve outside the project root',
      () => {
        const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'hdbg-symlink-'))
        const root = path.join(parent, 'project')
        const manifestDir = path.join(root, '.harness', '.debug')
        const outsideDir = path.join(parent, 'outside')
        const outside = path.join(outsideDir, 'outside.js')
        const linkedDir = path.join(root, 'linked')
        fs.mkdirSync(manifestDir, { recursive: true })
        fs.mkdirSync(outsideDir)
        fs.writeFileSync(outside, '/*HDBG:link*/ touched()\nconst keep = true\n')
        fs.symlinkSync(outsideDir, linkedDir)
        fs.writeFileSync(path.join(manifestDir, 'link.json'), JSON.stringify({
          session: 'link',
          root,
          files: ['linked/outside.js'],
          helpers: [],
        }))

        try {
          const cleanup = spawnSync(process.execPath, [
            cleanupScript,
            '--session',
            'link',
            '--root',
            root,
            '--no-shutdown',
          ], { encoding: 'utf-8' })
          expect(cleanup.status).toBe(1)
          expect(cleanup.stderr).toContain('resolves outside root')
          expect(fs.readFileSync(outside, 'utf-8')).toBe(
            '/*HDBG:link*/ touched()\nconst keep = true\n',
          )
        } finally {
          fs.rmSync(parent, { recursive: true, force: true })
        }
      },
    )
  })
})
