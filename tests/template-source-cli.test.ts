import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import YAML from 'yaml'
import { create } from 'tar'

const HARNESS_BIN = path.resolve('bin/devkeel.js')
const TEMPLATE_ROOT = path.resolve('templates')

describe('template source CLI', () => {
  let tmpDir: string
  let fakeBinDir: string
  let fakeNpmScript: string
  let npmLog: string
  let tarballs: Record<string, string>

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-template-source-cli-'))
    fakeBinDir = path.join(tmpDir, 'bin')
    fs.mkdirSync(fakeBinDir, { recursive: true })
    npmLog = path.join(tmpDir, 'npm-log.jsonl')
    tarballs = {}

    fakeNpmScript = path.join(fakeBinDir, 'fake-npm.cjs')
    fs.writeFileSync(fakeNpmScript, [
      "'use strict'",
      "const fs = require('node:fs')",
      "const path = require('node:path')",
      'const args = process.argv.slice(2)',
      "fs.appendFileSync(process.env['FAKE_NPM_LOG'], JSON.stringify({ args, cwd: process.cwd() }) + '\\n')",
      "if (args[0] === 'config' && args[1] === 'get') { process.stdout.write(process.env['FAKE_NPM_REGISTRY'] + '\\n'); process.exit(0) }",
      "if (args[0] === 'view') { process.stdout.write(JSON.stringify(process.env['FAKE_NPM_VERSION']) + '\\n'); process.exit(0) }",
      "if (args[0] === 'pack') {",
      "  const nameAndVersion = args[1]",
      "  const tarballs = JSON.parse(process.env['FAKE_NPM_TARBALLS'])",
      "  if (nameAndVersion.startsWith(process.env['FAKE_NPM_FAIL_PACKAGE'] + '@')) process.exit(1)",
      '  const registryArg = args.find(arg => arg.startsWith("--registry="))',
      '  const registry = registryArg ? registryArg.slice("--registry=".length) : ""',
      '  const tarball = tarballs[`${nameAndVersion}|${registry}`] || tarballs[nameAndVersion]',
      "  const destination = args[args.indexOf('--pack-destination') + 1]",
      '  if (!tarball || !destination || args.includes("--ignore-scripts") === false) process.exit(1)',
      '  const filename = path.basename(tarball)',
      '  fs.copyFileSync(tarball, path.join(destination, filename))',
      '  process.stdout.write(filename + "\\n")',
      '  process.exit(0)',
      '}',
      'process.exit(1)',
      '',
    ].join('\n'), 'utf-8')

    const npmExecutable = path.join(fakeBinDir, process.platform === 'win32' ? 'npm.cmd' : 'npm')
    const wrapper = process.platform === 'win32'
      ? `@"${process.execPath}" "${fakeNpmScript}" %*\r\n`
      : `#!/bin/sh\nexec "${process.execPath}" "${fakeNpmScript}" "$@"\n`
    fs.writeFileSync(npmExecutable, wrapper, 'utf-8')
    if (process.platform !== 'win32') fs.chmodSync(npmExecutable, 0o755)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  async function createTemplateTarball(packageName: string, version: string, marker: string, registry?: string, agentsMarker?: string): Promise<string> {
    const identity = `${packageName.replaceAll('/', '-')}-${version}-${Object.keys(tarballs).length}`
    const fixtureRoot = path.join(tmpDir, 'fixtures', identity)
    const packageRoot = path.join(fixtureRoot, 'package')
    fs.mkdirSync(packageRoot, { recursive: true })
    fs.cpSync(TEMPLATE_ROOT, packageRoot, { recursive: true })
    fs.writeFileSync(path.join(packageRoot, 'package.json'), JSON.stringify({ name: packageName, version }), 'utf-8')

    const versionsPath = path.join(packageRoot, 'versions-yml.yml')
    const versions = YAML.parse(fs.readFileSync(versionsPath, 'utf-8')) as {
      rules: Record<string, string>
    }
    versions.rules['source-fixture'] = '1.0.0'
    fs.writeFileSync(versionsPath, YAML.stringify(versions), 'utf-8')
    const markerPath = path.join(packageRoot, 'rules', 'source-fixture.md')
    fs.mkdirSync(path.dirname(markerPath), { recursive: true })
    fs.writeFileSync(markerPath, `${marker}\n`, 'utf-8')

    if (agentsMarker) fs.appendFileSync(path.join(packageRoot, 'agents-md.md'), `\n${agentsMarker}\n`)
    const tarball = path.join(tmpDir, `${identity}.tgz`)
    await create({ gzip: true, file: tarball, cwd: fixtureRoot }, ['package'])
    tarballs[registry ? `${packageName}@${version}|${registry}` : `${packageName}@${version}`] = tarball
    return tarball
  }

  function runCli(projectRoot: string, args: string[], env: NodeJS.ProcessEnv = {}): ReturnType<typeof spawnSync> {
    return spawnSync(process.execPath, [HARNESS_BIN, ...args], {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 30_000,
      env: {
        ...env,
        HOME: path.join(tmpDir, 'home'),
        USERPROFILE: path.join(tmpDir, 'home'),
        PATH: `${fakeBinDir}${path.delimiter}${process.env['PATH'] ?? ''}`,
        FAKE_NPM_LOG: npmLog,
        FAKE_NPM_REGISTRY: 'https://npm-config.example.test/',
        FAKE_NPM_VERSION: env['FAKE_NPM_VERSION'] ?? '1.0.0',
        FAKE_NPM_TARBALLS: JSON.stringify(tarballs),
      },
    })
  }

  function readNpmCalls(): Array<{ args: string[]; cwd: string }> {
    if (!fs.existsSync(npmLog)) return []
    return fs.readFileSync(npmLog, 'utf-8').trim().split(/\r?\n/).filter(Boolean)
      .map(line => JSON.parse(line) as { args: string[]; cwd: string })
  }

  function projectSourcePath(projectRoot: string): string {
    return path.join(projectRoot, '.harness', 'template-source.json')
  }

  function userSourcePath(): string {
    return path.join(tmpDir, 'home', '.harness', 'template-source.json')
  }

  function writeUserSource(source: Record<string, string>): void {
    fs.mkdirSync(path.dirname(userSourcePath()), { recursive: true })
    fs.writeFileSync(userSourcePath(), JSON.stringify(source, null, 2) + '\n', 'utf-8')
  }

  function readProjectSource(projectRoot: string): unknown {
    return JSON.parse(fs.readFileSync(projectSourcePath(projectRoot), 'utf-8'))
  }

  function readVersionsText(projectRoot: string): string {
    return fs.readFileSync(path.join(projectRoot, '.harness', 'versions.yml'), 'utf-8')
  }

  it('should init from an explicit source, save it, and run npm in the project root', async () => {
    await createTemplateTarball('@acme/templates', '1.0.0', 'custom source')
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)
    fs.writeFileSync(path.join(projectRoot, '.npmrc'), '//registry.example.test/:_authToken=fixture-token\n', 'utf-8')

    const result = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', '@acme/templates', '--template-registry', 'https://registry.example.test',
    ])

    expect(result.status).toBe(0)
    expect(readProjectSource(projectRoot)).toEqual({
      packageName: '@acme/templates',
      registry: 'https://registry.example.test/',
    })
    expect(fs.existsSync(userSourcePath())).toBe(false)
    expect(fs.readFileSync(path.join(projectRoot, '.harness', 'rules', 'source-fixture.md'), 'utf-8')).toBe('custom source\n')
    const calls = readNpmCalls()
    expect(calls.length).toBeGreaterThan(0)
    expect(calls.every(call => call.cwd === projectRoot)).toBe(true)
    expect(calls.some(call => call.args[0] === 'pack'
      && call.args.includes('--pack-destination')
      && call.args.includes('--ignore-scripts')
      && call.args.includes('--@acme:registry=https://registry.example.test/'))).toBe(true)
  })

  it('should let separate projects inherit one user source without creating project source files', async () => {
    await createTemplateTarball('global-templates', '1.0.0', 'inherited source')
    const userSource = { packageName: 'global-templates', registry: 'https://global.example.test/' }
    writeUserSource(userSource)
    const firstProject = path.join(tmpDir, 'first-project')
    const secondProject = path.join(tmpDir, 'second-project')
    fs.mkdirSync(firstProject)
    fs.mkdirSync(secondProject)

    for (const projectRoot of [firstProject, secondProject]) {
      const result = runCli(projectRoot, ['init', '--yes', '--name', 'source-fixture', '--targets', 'copilot'])
      expect(result.status).toBe(0)
      expect(fs.existsSync(projectSourcePath(projectRoot))).toBe(false)
      expect(fs.readFileSync(path.join(projectRoot, '.harness', 'rules', 'source-fixture.md'), 'utf-8')).toBe('inherited source\n')
    }

    expect(fs.readFileSync(userSourcePath(), 'utf-8')).toBe(JSON.stringify(userSource, null, 2) + '\n')
    const packageCalls = readNpmCalls().filter(call => call.args[0] === 'pack')
    expect(packageCalls).toHaveLength(1)
    expect(packageCalls.every(call => call.args[1] === 'global-templates@1.0.0'
      && call.args.includes('--registry=https://global.example.test/'))).toBe(true)
  })

  it('should isolate cache entries for the same package and version on different registries', async () => {
    await createTemplateTarball('shared-templates', '1.0.0', 'registry one', 'https://one.example.test/')
    await createTemplateTarball('shared-templates', '1.0.0', 'registry two', 'https://two.example.test/')
    const firstProject = path.join(tmpDir, 'registry-one-project')
    const secondProject = path.join(tmpDir, 'registry-two-project')
    fs.mkdirSync(firstProject)
    fs.mkdirSync(secondProject)

    const first = runCli(firstProject, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'shared-templates', '--template-registry', 'https://one.example.test/',
    ])
    const second = runCli(secondProject, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'shared-templates', '--template-registry', 'https://two.example.test/',
    ])

    expect(first.status).toBe(0)
    expect(second.status).toBe(0)
    expect(fs.readFileSync(path.join(firstProject, '.harness', 'rules', 'source-fixture.md'), 'utf-8')).toBe('registry one\n')
    expect(fs.readFileSync(path.join(secondProject, '.harness', 'rules', 'source-fixture.md'), 'utf-8')).toBe('registry two\n')
  })

  it('should reject a tarball whose package name does not match the requested source', async () => {
    const wrongPackageTarball = await createTemplateTarball('wrong-templates', '1.0.0', 'wrong package')
    tarballs['expected-templates@1.0.0'] = wrongPackageTarball
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)

    const result = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'expected-templates', '--template-registry', 'https://registry.example.test/',
    ])

    expect(result.status).not.toBe(0)
    expect(fs.existsSync(path.join(projectRoot, '.harness', 'versions.yml'))).toBe(false)
    expect(fs.existsSync(projectSourcePath(projectRoot))).toBe(false)
  })

  it('should reuse the saved package and registry on force update and fetch its new version', async () => {
    await createTemplateTarball('acme-templates', '1.0.0', 'version one')
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)
    const init = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'acme-templates', '--template-registry', 'https://source.example.test/',
    ])
    expect(init.status).toBe(0)

    await createTemplateTarball('acme-templates', '1.1.0', 'version two')
    const update = runCli(projectRoot, ['update', '--force'], { FAKE_NPM_VERSION: '1.1.0' })

    expect(update.status).toBe(0)
    expect(readProjectSource(projectRoot)).toEqual({
      packageName: 'acme-templates',
      registry: 'https://source.example.test/',
    })
    expect(fs.readFileSync(path.join(projectRoot, '.harness', 'rules', 'source-fixture.md'), 'utf-8')).toBe('version two\n')
    const calls = readNpmCalls().filter(call => call.args[0] === 'view' || call.args[0] === 'pack')
    expect(calls.some(call => call.args[1] === 'acme-templates@latest')).toBe(true)
    expect(calls.some(call => call.args[0] === 'pack'
      && call.args[1] === 'acme-templates@1.1.0'
      && call.args.includes('--registry=https://source.example.test/'))).toBe(true)
  })

  it('should leave project source and assets untouched for a dry-run source switch', async () => {
    await createTemplateTarball('first-templates', '1.0.0', 'first source')
    await createTemplateTarball('second-templates', '1.0.0', 'second source')
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)
    const init = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'first-templates', '--template-registry', 'https://first.example.test/',
    ])
    expect(init.status).toBe(0)
    const sourceBefore = fs.readFileSync(projectSourcePath(projectRoot), 'utf-8')
    const versionsBefore = readVersionsText(projectRoot)
    const assetPath = path.join(projectRoot, '.harness', 'rules', 'source-fixture.md')
    const assetBefore = fs.readFileSync(assetPath, 'utf-8')
    const previousCalls = readNpmCalls().length

    const update = runCli(projectRoot, [
      'update', '--dry-run', '--template-package', 'second-templates',
      '--template-registry', 'https://second.example.test/',
    ])

    expect(update.status).toBe(0)
    expect(update.stdout).toMatch(/source-fixture.*1\.0\.0 \(source changed\)\s*→\s*1\.0\.0/)
    expect(fs.readFileSync(projectSourcePath(projectRoot), 'utf-8')).toBe(sourceBefore)
    expect(readVersionsText(projectRoot)).toBe(versionsBefore)
    expect(fs.readFileSync(assetPath, 'utf-8')).toBe(assetBefore)
    expect(readNpmCalls().slice(previousCalls).some(call => call.args[0] === 'view'
      && call.args[1] === 'second-templates@latest')).toBe(true)
  })

  it('should refresh assets when switching source even if component versions match', async () => {
    await createTemplateTarball('first-templates', '1.0.0', 'first source')
    await createTemplateTarball('second-templates', '1.0.0', 'second source')
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)
    const init = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'first-templates', '--template-registry', 'https://first.example.test/',
    ])
    expect(init.status).toBe(0)

    const update = runCli(projectRoot, [
      'update', '--force', '--template-package', 'second-templates',
      '--template-registry', 'https://second.example.test/',
    ])

    expect(update.status).toBe(0)
    expect(fs.readFileSync(path.join(projectRoot, '.harness', 'rules', 'source-fixture.md'), 'utf-8')).toBe('second source\n')
    expect(readProjectSource(projectRoot)).toEqual({
      packageName: 'second-templates',
      registry: 'https://second.example.test/',
    })
  })

  it('should keep the old source and retry a partially applied init source switch', async () => {
    await createTemplateTarball('first-templates', '1.0.0', 'first source')
    await createTemplateTarball('second-templates', '1.0.0', 'second source', undefined, 'New source execution contract')
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)
    const common = ['--template-registry', 'https://source.example.test/']
    expect(runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'first-templates', ...common,
    ]).status).toBe(0)
    const originalSource = fs.readFileSync(projectSourcePath(projectRoot), 'utf-8')
    const originalAgents = fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf-8')
    const switched = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'second-templates', ...common,
    ])
    expect(switched.status).toBe(0)
    expect(fs.readFileSync(projectSourcePath(projectRoot), 'utf-8')).toBe(originalSource)
    expect(fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf-8')).toBe(originalAgents)
    expect(YAML.parse(readVersionsText(projectRoot)).templateSource).toBe('pending')
    const retried = runCli(projectRoot, ['update', '--force', '--template-package', 'second-templates', ...common])
    expect(retried.status).toBe(0)
    expect(readProjectSource(projectRoot)).toEqual({ packageName: 'second-templates', registry: 'https://source.example.test/' })
    expect(YAML.parse(readVersionsText(projectRoot)).templateSource).toMatch(/^[a-f0-9]{64}$/)
    expect(fs.readFileSync(path.join(projectRoot, 'AGENTS.md'), 'utf-8')).toContain('New source execution contract')
  })

  it('should preserve the old source and assets when fetching a switched source fails', async () => {
    await createTemplateTarball('first-templates', '1.0.0', 'first source')
    await createTemplateTarball('second-templates', '1.0.0', 'second source')
    const projectRoot = path.join(tmpDir, 'project')
    fs.mkdirSync(projectRoot)
    const init = runCli(projectRoot, [
      'init', '--yes', '--name', 'source-fixture', '--targets', 'copilot',
      '--template-package', 'first-templates', '--template-registry', 'https://first.example.test/',
    ])
    expect(init.status).toBe(0)
    const sourceBefore = fs.readFileSync(projectSourcePath(projectRoot), 'utf-8')
    const versionsBefore = readVersionsText(projectRoot)
    const assetPath = path.join(projectRoot, '.harness', 'rules', 'source-fixture.md')
    const assetBefore = fs.readFileSync(assetPath, 'utf-8')

    const update = runCli(projectRoot, [
      'update', '--force', '--template-package', 'second-templates',
      '--template-registry', 'https://second.example.test/',
    ], { FAKE_NPM_FAIL_PACKAGE: 'second-templates' })

    expect(update.status).not.toBe(0)
    expect(fs.readFileSync(projectSourcePath(projectRoot), 'utf-8')).toBe(sourceBefore)
    expect(readVersionsText(projectRoot)).toBe(versionsBefore)
    expect(fs.readFileSync(assetPath, 'utf-8')).toBe(assetBefore)
  })
})
