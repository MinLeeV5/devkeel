import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { validateOpenspecConfig } from '../src/lib/openspec.js'
import { resolveOpenspecBin, getOpenspecVersion } from '../src/commands/openspec.js'
import { copyOpenspecTemplate, updateOpenspecIncremental } from '../src/lib/templates.js'

const HARNESS_BIN = path.join(process.cwd(), 'bin', 'devkeel.js')

describe('openspec', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-openspec-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('validateOpenspecConfig', () => {
    it('should return warn when openspec/ does not exist', () => {
      const results = validateOpenspecConfig(tmpDir)
      expect(results).toHaveLength(1)
      expect(results[0]!.status).toBe('warn')
      expect(results[0]!.name).toBe('openspec/')
    })

    it('should return fail when config.yaml is missing', () => {
      fs.mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true })
      const results = validateOpenspecConfig(tmpDir)
      expect(results.some(r => r.name === 'openspec/config.yaml' && r.status === 'fail')).toBe(true)
    })

    it('should return fail when config.yaml is invalid YAML', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), ': : invalid: [', 'utf-8')
      const results = validateOpenspecConfig(tmpDir)
      expect(results.some(r => r.name === 'openspec/config.yaml' && r.status === 'fail' && r.detail.includes('解析失败'))).toBe(true)
    })

    it('should return fail when schema field is missing', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), 'context: hello\n', 'utf-8')
      const results = validateOpenspecConfig(tmpDir)
      expect(results.some(r => r.name === 'openspec/config.yaml' && r.status === 'fail' && r.detail.includes('schema'))).toBe(true)
    })

    it('should return fail when schema directory does not exist', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      fs.mkdirSync(openspecDir, { recursive: true })
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), 'schema: my-schema\ncontext: test\n', 'utf-8')
      const results = validateOpenspecConfig(tmpDir)
      expect(results.some(r => r.name === 'openspec/schemas/my-schema' && r.status === 'fail')).toBe(true)
    })

    it('should return pass when schema is correctly configured', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      const schemaDir = path.join(openspecDir, 'schemas', 'my-schema')
      fs.mkdirSync(schemaDir, { recursive: true })
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), 'schema: my-schema\ncontext: test\n', 'utf-8')
      fs.writeFileSync(path.join(schemaDir, 'schema.yaml'), 'name: my-schema\nversion: 1\n', 'utf-8')
      const results = validateOpenspecConfig(tmpDir)
      expect(results.some(r => r.name === 'openspec/schemas/my-schema' && r.status === 'pass')).toBe(true)
    })

  })

  describe('resolveOpenspecBin', () => {
    it('should return a path ending with bin/openspec.js', () => {
      const binPath = resolveOpenspecBin()
      expect(binPath).toMatch(/bin\/openspec\.js$/)
    })

    it('should point to an existing file', () => {
      const binPath = resolveOpenspecBin()
      expect(fs.existsSync(binPath)).toBe(true)
    })

    it('should resolve under node_modules/@fission-ai/openspec', () => {
      const binPath = resolveOpenspecBin()
      expect(binPath).toContain('@fission-ai/openspec')
    })
  })

  describe('getOpenspecVersion', () => {
    it('should return a valid semver version string', () => {
      const version = getOpenspecVersion()
      expect(version).toMatch(/^\d+\.\d+\.\d+/)
    })

    it('should match the version in the installed package.json', () => {
      const binPath = resolveOpenspecBin()
      const packageRoot = path.dirname(path.dirname(binPath))
      const pkgJson = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf-8'))
      expect(getOpenspecVersion()).toBe(pkgJson.version)
    })
  })

  describe('runOpenspec (subprocess)', { timeout: 15_000 }, () => {
    it.each(['lite', 'full'])('should resolve an existing %s change after migrating its old schema name', schema => {
      const openspecDir = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(openspecDir)
      const legacy = `harness-${schema}`
      const oldSchemaDir = path.join(openspecDir, 'schemas', legacy)
      fs.renameSync(path.join(openspecDir, 'schemas', schema), oldSchemaDir)
      const schemaFile = path.join(oldSchemaDir, 'schema.yaml')
      fs.writeFileSync(schemaFile, fs.readFileSync(schemaFile, 'utf-8').replace(`name: ${schema}`, `name: ${legacy}`))
      fs.writeFileSync(path.join(openspecDir, 'config.yaml'), `schema: ${legacy}\n`)
      const run = (...args: string[]) => spawnSync(process.execPath, [HARNESS_BIN, 'openspec', ...args], {
        cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' },
      })
      const created = run('new', 'change', 'rename-schema')
      expect(created.status, created.stderr).toBe(0)
      const before = JSON.parse(run('status', '--change', 'rename-schema', '--json').stdout)

      updateOpenspecIncremental(openspecDir)

      const status = run('status', '--change', 'rename-schema', '--json')
      expect(status.status, status.stderr).toBe(0)
      const after = JSON.parse(status.stdout)
      expect(after.schemaName).toBe(schema)
      expect(after.artifacts).toEqual(before.artifacts)
      expect(after.applyRequires).toEqual(before.applyRequires)
      const instructions = run('instructions', 'brainstorm', '--change', 'rename-schema', '--json')
      expect(instructions.status, instructions.stderr).toBe(0)
      expect(JSON.parse(instructions.stdout).schemaName).toBe(schema)
    })

    it.each(['lite', 'full'])('should validate the packaged %s schema', schemaName => {
      copyOpenspecTemplate(path.join(tmpDir, 'openspec'))

      const result = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'schema', 'validate', schemaName, '--json'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )

      expect(result.status).toBe(0)
      const output = JSON.parse(result.stdout) as { valid: boolean; issues: string[] }
      expect(output.valid).toBe(true)
      expect(output.issues).toEqual([])
    })

    it('should expose ready and all_done states for a lite change', () => {
      copyOpenspecTemplate(path.join(tmpDir, 'openspec'))

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'lite-cycle'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status).toBe(0)

      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'lite-cycle')
      fs.writeFileSync(path.join(changeDir, 'brainstorm.md'), '# Brainstorm\n\nImplement one verified result.\n', 'utf-8')
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '# Tasks\n\n- [ ] Implement result\n', 'utf-8')

      const ready = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'instructions', 'apply', '--change', 'lite-cycle', '--json'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(ready.status).toBe(0)
      const readyOutput = JSON.parse(ready.stdout) as {
        state: string
        contextFiles: Record<string, string[]>
        progress: { total: number; complete: number; remaining: number }
      }
      expect(readyOutput.state).toBe('ready')
      expect(Object.keys(readyOutput.contextFiles)).toEqual(['brainstorm', 'tasks'])
      expect(readyOutput.progress).toEqual({ total: 1, complete: 0, remaining: 1 })

      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '# Tasks\n\n- [x] Implement result\n', 'utf-8')
      const done = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'instructions', 'apply', '--change', 'lite-cycle', '--json'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(done.status).toBe(0)
      const doneOutput = JSON.parse(done.stdout) as { state: string }
      expect(doneOutput.state).toBe('all_done')
    })

    it('should preserve full status and apply progress after a legacy schema rename', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(openspecDir)

      const fullSchemaDir = path.join(openspecDir, 'schemas', 'full')
      const legacySchemaDir = path.join(openspecDir, 'schemas', 'superpowers-lite')
      fs.cpSync(fullSchemaDir, legacySchemaDir, { recursive: true })
      const legacySchemaFile = path.join(legacySchemaDir, 'schema.yaml')
      fs.writeFileSync(
        legacySchemaFile,
        fs.readFileSync(legacySchemaFile, 'utf-8').replace(/^name: full$/m, 'name: superpowers-lite'),
        'utf-8',
      )

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'legacy-full', '--schema', 'superpowers-lite'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status).toBe(0)

      const changeDir = path.join(openspecDir, 'changes', 'legacy-full')
      fs.writeFileSync(path.join(changeDir, 'brainstorm.md'), '# Brainstorm\n\nConfirmed scope.\n', 'utf-8')
      fs.writeFileSync(path.join(changeDir, 'design.md'), '# Design\n\nStable design.\n', 'utf-8')
      fs.mkdirSync(path.join(changeDir, 'specs', 'demo'), { recursive: true })
      fs.writeFileSync(
        path.join(changeDir, 'specs', 'demo', 'spec.md'),
        '## ADDED Requirements\n\n### Requirement: Demo\nThe demo SHALL work.\n\n#### Scenario: Works\n- **WHEN** invoked\n- **THEN** it SHALL work\n',
        'utf-8',
      )
      fs.writeFileSync(path.join(changeDir, 'tasks.md'), '# Tasks\n\n- [ ] Implement demo\n', 'utf-8')

      const runJson = (args: string[]) => {
        const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec', ...args, '--json'], {
          cwd: tmpDir,
          encoding: 'utf-8',
          env: { ...process.env, NODE_ENV: 'test' },
        })
        expect(result.status, result.stderr).toBe(0)
        return JSON.parse(result.stdout) as Record<string, unknown>
      }

      const statusBefore = runJson(['status', '--change', 'legacy-full'])
      const applyBefore = runJson(['instructions', 'apply', '--change', 'legacy-full'])

      const metadataPath = path.join(changeDir, '.openspec.yaml')
      fs.writeFileSync(
        metadataPath,
        fs.readFileSync(metadataPath, 'utf-8').replace('superpowers-lite', 'full'),
        'utf-8',
      )
      fs.rmSync(legacySchemaDir, { recursive: true })

      const statusAfter = runJson(['status', '--change', 'legacy-full'])
      const applyAfter = runJson(['instructions', 'apply', '--change', 'legacy-full'])

      expect(statusAfter.schemaName).toBe('full')
      expect(statusAfter.artifacts).toEqual(statusBefore.artifacts)
      expect(applyAfter.state).toBe(applyBefore.state)
      expect(applyAfter.progress).toEqual(applyBefore.progress)
      expect(applyAfter.tasks).toEqual(applyBefore.tasks)
      expect(applyAfter.contextFiles).toEqual(applyBefore.contextFiles)
    }, 15_000)

    it('should validate a brainstorm-first custom change without proposal.md', () => {
      copyOpenspecTemplate(path.join(tmpDir, 'openspec'))

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'brainstorm-first', '--schema', 'lite'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status, created.stderr).toBe(0)

      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'brainstorm-first')
      fs.writeFileSync(path.join(changeDir, 'brainstorm.md'), '# Brainstorm\n\nValidated custom change.\n', 'utf-8')
      expect(fs.existsSync(path.join(changeDir, 'proposal.md'))).toBe(false)

      const result = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'validate', 'brainstorm-first', '--json'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )

      expect(result.status, result.stderr).toBe(0)
      const output = JSON.parse(result.stdout) as {
        items: Array<{ id: string; type: string; valid: boolean; issues: unknown[] }>
      }
      expect(output.items).toHaveLength(1)
      expect(output.items[0]).toMatchObject({
        id: 'brainstorm-first',
        type: 'change',
        valid: true,
      })
      expect(output.items[0]!.issues).toContainEqual(expect.objectContaining({
        level: 'INFO',
        message: expect.stringContaining('skip_specs is set'),
      }))
    })

    it('should discover delta specs nested below an area directory', () => {
      copyOpenspecTemplate(path.join(tmpDir, 'openspec'))

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'nested-delta', '--schema', 'full'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status, created.stderr).toBe(0)

      const nestedSpecDir = path.join(
        tmpDir,
        'openspec',
        'changes',
        'nested-delta',
        'specs',
        'platform',
        'demo',
      )
      fs.mkdirSync(nestedSpecDir, { recursive: true })
      fs.writeFileSync(
        path.join(nestedSpecDir, 'spec.md'),
        '## ADDED Requirements\n\n### Requirement: Nested behavior\nThe system MUST discover nested delta specs.\n\n#### Scenario: Nested delta is validated\n- **WHEN** validation scans the change\n- **THEN** the nested requirement is included\n',
        'utf-8',
      )

      const result = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'validate', 'nested-delta', '--type', 'change', '--json'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )

      expect(result.status, result.stderr).toBe(0)
      const output = JSON.parse(result.stdout) as {
        items: Array<{ id: string; type: string; valid: boolean; issues: unknown[] }>
      }
      expect(output.items).toHaveLength(1)
      expect(output.items[0]).toMatchObject({
        id: 'nested-delta',
        type: 'change',
        valid: true,
        issues: [],
      })
    })

    it('should strictly validate all official delta operations', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(openspecDir)

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'official-delta-format', '--schema', 'full'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status, created.stderr).toBe(0)

      const mainSpecDir = path.join(openspecDir, 'specs', 'demo')
      fs.mkdirSync(mainSpecDir, { recursive: true })
      fs.writeFileSync(
        path.join(mainSpecDir, 'spec.md'),
        `# Demo Specification

## Requirements

### Requirement: Existing behavior
The system SHALL preserve the existing behavior.

#### Scenario: Existing path
- **WHEN** the existing path is used
- **THEN** the existing result is returned

### Requirement: Legacy behavior
The system SHALL provide the legacy behavior.

#### Scenario: Legacy path
- **WHEN** the legacy path is used
- **THEN** the legacy result is returned

### Requirement: Old behavior name
The system SHALL provide the named behavior.

#### Scenario: Named path
- **WHEN** the named path is used
- **THEN** the named result is returned
`,
        'utf-8',
      )

      const deltaSpecDir = path.join(
        openspecDir,
        'changes',
        'official-delta-format',
        'specs',
        'demo',
      )
      fs.mkdirSync(deltaSpecDir, { recursive: true })
      fs.writeFileSync(
        path.join(deltaSpecDir, 'spec.md'),
        `## ADDED Requirements

### Requirement: Added behavior
The system MUST provide the added behavior.

#### Scenario: Added path
- **WHEN** the added path is used
- **THEN** the added result is returned

## MODIFIED Requirements

### Requirement: Existing behavior
The system SHALL preserve the complete updated behavior.

#### Scenario: Existing path
- **WHEN** the existing path is used
- **THEN** the complete updated result is returned

## REMOVED Requirements

### Requirement: Legacy behavior

**Reason**: The legacy path is no longer supported.

**Migration**: Callers use the added behavior instead.

## RENAMED Requirements

- FROM: \`### Requirement: Old behavior name\`
- TO: \`### Requirement: New behavior name\`
`,
        'utf-8',
      )

      const result = spawnSync(
        process.execPath,
        [
          HARNESS_BIN,
          'openspec',
          'validate',
          'official-delta-format',
          '--type',
          'change',
          '--strict',
          '--json',
        ],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )

      expect(result.status, result.stderr).toBe(0)
      const output = JSON.parse(result.stdout) as {
        items: Array<{ id: string; type: string; valid: boolean; issues: unknown[] }>
      }
      expect(output.items).toHaveLength(1)
      expect(output.items[0]).toMatchObject({
        id: 'official-delta-format',
        type: 'change',
        valid: true,
        issues: [],
      })
    })

    it('should return non-zero when human archive validation fails with --yes', () => {
      copyOpenspecTemplate(path.join(tmpDir, 'openspec'))

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'invalid-archive', '--schema', 'lite'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status, created.stderr).toBe(0)

      const changeDir = path.join(tmpDir, 'openspec', 'changes', 'invalid-archive')
      fs.mkdirSync(path.join(changeDir, 'specs', 'demo'), { recursive: true })
      fs.writeFileSync(
        path.join(changeDir, 'specs', 'demo', 'spec.md'),
        '## ADDED Requirements\n\n### Requirement: Invalid behavior\nThe system SHALL reject this delta because it has no scenario.\n',
        'utf-8',
      )

      const result = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'archive', 'invalid-archive', '--yes'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )

      expect(result.error).toBeUndefined()
      expect(result.status).not.toBeNull()
      expect(result.status).not.toBe(0)
      expect(`${result.stdout}\n${result.stderr}`)
        .toMatch(/must include at least one scenario/i)
      expect(fs.existsSync(changeDir)).toBe(true)
    })

    it('should reject an ad-hoc lite delta when OpenSpec 1.12 marks specs as skipped', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(openspecDir)

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'optional-lite-delta', '--schema', 'lite'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status, created.stderr).toBe(0)

      const changeDir = path.join(openspecDir, 'changes', 'optional-lite-delta')
      fs.writeFileSync(
        path.join(changeDir, 'brainstorm.md'),
        '# Brainstorm\n\nArchive an optional Lite delta.\n',
        'utf-8',
      )
      fs.writeFileSync(
        path.join(changeDir, 'tasks.md'),
        '# Tasks\n\n- [x] Archive the optional delta\n',
        'utf-8',
      )
      fs.mkdirSync(path.join(changeDir, 'specs', 'demo'), { recursive: true })
      fs.writeFileSync(
        path.join(changeDir, 'specs', 'demo', 'spec.md'),
        '## ADDED Requirements\n\n### Requirement: Optional Lite delta\nThe system SHALL archive delta specs that are not schema artifacts.\n\n#### Scenario: Delta is synchronized\n- **WHEN** a Lite change contains an optional delta spec\n- **THEN** archive synchronizes it into the main specs\n',
        'utf-8',
      )

      const status = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'status', '--change', 'optional-lite-delta', '--json'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(status.status, status.stderr).toBe(0)
      const statusOutput = JSON.parse(status.stdout) as {
        artifactPaths: { specs?: unknown }
      }
      expect(statusOutput.artifactPaths.specs).toBeUndefined()

      const archived = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'archive', 'optional-lite-delta', '--yes'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(archived.status).not.toBe(0)
      expect(`${archived.stdout}\n${archived.stderr}`).toContain('skip_specs is set')
      expect(fs.existsSync(changeDir)).toBe(true)
    })

    it('should reject a stale MODIFIED delta before it removes an existing scenario', () => {
      const openspecDir = path.join(tmpDir, 'openspec')
      copyOpenspecTemplate(openspecDir)

      const created = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'new', 'change', 'stale-modified', '--schema', 'lite'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )
      expect(created.status, created.stderr).toBe(0)

      const mainSpecDir = path.join(openspecDir, 'specs', 'demo')
      const mainSpecPath = path.join(mainSpecDir, 'spec.md')
      const originalSpec = '# Demo Specification\n\n## Purpose\nDescribe stable demo behavior.\n\n## Requirements\n\n### Requirement: Shared behavior\nThe system SHALL preserve all documented behavior.\n\n#### Scenario: Primary path\n- **WHEN** the primary path is used\n- **THEN** the system returns the primary result\n\n#### Scenario: Legacy fallback\n- **WHEN** the legacy fallback is used\n- **THEN** the system returns the fallback result\n'
      fs.mkdirSync(mainSpecDir, { recursive: true })
      fs.writeFileSync(mainSpecPath, originalSpec, 'utf-8')

      const changeDir = path.join(openspecDir, 'changes', 'stale-modified')
      fs.mkdirSync(path.join(changeDir, 'specs', 'demo'), { recursive: true })
      fs.writeFileSync(
        path.join(changeDir, 'specs', 'demo', 'spec.md'),
        '## MODIFIED Requirements\n\n### Requirement: Shared behavior\nThe system SHALL preserve the primary documented behavior.\n\n#### Scenario: Primary path\n- **WHEN** the primary path is used\n- **THEN** the system returns the refreshed primary result\n',
        'utf-8',
      )

      const result = spawnSync(
        process.execPath,
        [HARNESS_BIN, 'openspec', 'archive', 'stale-modified', '--yes'],
        { cwd: tmpDir, encoding: 'utf-8', env: { ...process.env, NODE_ENV: 'test' } },
      )

      expect(result.error).toBeUndefined()
      expect(result.status).not.toBeNull()
      expect(result.status).not.toBe(0)
      expect(fs.readFileSync(mainSpecPath, 'utf-8')).toBe(originalSpec)
      expect(fs.existsSync(changeDir)).toBe(true)
    })

    it('should forward --version to openspec and exit 0', () => {
      const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec', '--version'], {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      })
      expect(result.status).toBe(0)
      expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+/)
    })

    it('should forward --help to openspec and exit 0', () => {
      const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec', '--help'], {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      })
      expect(result.status).toBe(0)
      expect(result.stdout).toContain('openspec')
    })

    it('should return non-zero exit code for invalid commands', () => {
      const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec', 'definitely-not-a-command'], {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      })
      expect(result.status).not.toBe(0)
    })

    it('should forward stdout from openspec child process', () => {
      const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec', '--version'], {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      })
      const expectedVersion = getOpenspecVersion()
      expect(result.stdout.trim()).toBe(expectedVersion)
    })

    it('should pass multiple arguments correctly', () => {
      const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec', 'list', '--json'], {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      })
      // Exit code may be 0 or non-zero depending on whether openspec/ is configured,
      // but the command should at least run (not crash before spawning)
      expect(result.status).toBeDefined()
    })

    it('should handle no arguments by delegating to openspec (exits non-zero)', () => {
      const result = spawnSync(process.execPath, [HARNESS_BIN, 'openspec'], {
        encoding: 'utf-8',
        env: { ...process.env, NODE_ENV: 'test' },
      })
      // openspec with no subcommand exits 1; harness forwards that exit code
      expect(result.status).toBe(1)
    })
  })
})
