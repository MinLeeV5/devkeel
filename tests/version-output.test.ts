import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { create } from 'tar'

const HARNESS_BIN = path.resolve('bin/devkeel.js')
const harnessPackage = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8')) as { version: string }
const templatesPackage = JSON.parse(fs.readFileSync(path.resolve('templates/package.json'), 'utf-8')) as { version: string }

describe('version output', () => {
  let tmpDir: string
  let fakeBinDir: string
  let fakeTemplateTarball: string

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-version-output-'))
    fakeBinDir = path.join(tmpDir, 'bin')
    fs.mkdirSync(fakeBinDir, { recursive: true })

    const fixtureRoot = path.join(tmpDir, 'fixture')
    const fixturePackage = path.join(fixtureRoot, 'package')
    fs.mkdirSync(fixturePackage, { recursive: true })
    fs.writeFileSync(path.join(fixturePackage, 'package.json'), JSON.stringify({ name: 'devkeel-templates', version: '1.4.0' }), 'utf-8')
    fs.writeFileSync(path.join(fixturePackage, 'versions-yml.yml'), 'harness: "1.4.0"\n', 'utf-8')
    fakeTemplateTarball = path.join(tmpDir, 'template-fixture.tgz')
    await create({ gzip: true, file: fakeTemplateTarball, cwd: fixtureRoot }, ['package'])

    const fakeNpmScript = path.join(fakeBinDir, 'fake-npm.cjs')
    fs.writeFileSync(fakeNpmScript, [
      "'use strict'",
      "const fs = require('node:fs')",
      "const path = require('node:path')",
      'const args = process.argv.slice(2)',
      "if (process.env['FAKE_NPM_FAIL'] === '1') process.exit(1)",
      "if (args[0] === 'view' && args[1] === 'devkeel@beta' && args[2] === 'version') {",
      "  process.stdout.write(JSON.stringify(process.env['FAKE_BETA_HARNESS_VERSION']) + '\\n')",
      '  process.exit(0)',
      '}',
      "if (args[0] === 'view' && args[1] === 'devkeel@latest' && args[2] === 'version') {",
      "  process.stdout.write(JSON.stringify(process.env['FAKE_LATEST_HARNESS_VERSION']) + '\\n')",
      '  process.exit(0)',
      '}',
      "if (args[0] === 'view' && args[1] === 'devkeel-templates@beta' && args[2] === 'version') {",
      "  process.stdout.write(JSON.stringify(process.env['FAKE_BETA_TEMPLATE_VERSION']) + '\\n')",
      '  process.exit(0)',
      '}',
      "if (args[0] === 'view' && args[1] === 'devkeel-templates@latest' && args[2] === 'version') {",
      "  process.stdout.write(JSON.stringify(process.env['FAKE_LATEST_TEMPLATE_VERSION']) + '\\n')",
      '  process.exit(0)',
      '}',
      "if (args[0] === 'pack' && args[1] === 'devkeel-templates@1.4.0') {",
      "  const filename = 'devkeel-templates-1.4.0.tgz'",
      "  fs.copyFileSync(process.env['FAKE_TEMPLATE_TARBALL'], path.join(process.cwd(), filename))",
      "  process.stdout.write(filename + '\\n')",
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

  function prepareTemplatesCache(version: string): void {
    const cacheDir = path.join(tmpDir, '.harness', 'cache', 'devkeel-templates', version)
    fs.mkdirSync(cacheDir, { recursive: true })
    fs.writeFileSync(path.join(cacheDir, 'package.json'), JSON.stringify({ name: 'devkeel-templates', version }), 'utf-8')
    fs.writeFileSync(path.join(cacheDir, 'versions-yml.yml'), `harness: "${version}"\n`, 'utf-8')
  }

  function runVersion(
    args: string[],
    extraEnv: NodeJS.ProcessEnv,
  ): ReturnType<typeof spawnSync> {
    return spawnSync(process.execPath, [HARNESS_BIN, ...args], {
      cwd: path.resolve('.'),
      encoding: 'utf-8',
      env: {
        ...process.env,
        ...extraEnv,
        HOME: tmpDir,
        USERPROFILE: tmpDir,
        PATH: `${fakeBinDir}${path.delimiter}${process.env['PATH'] ?? ''}`,
      },
    })
  }

  it('should fetch and label the beta channel only when --beta is provided', () => {
    prepareTemplatesCache('2.0.0')

    const result = runVersion(['-V', '--beta'], {
      FAKE_BETA_HARNESS_VERSION: '0.9.1',
      FAKE_BETA_TEMPLATE_VERSION: '2.0.0',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toBe('devkeel 0.9.1 (beta)\ntemplates 2.0.0 (beta)\n')
  })

  it('should fetch the latest channel when --beta is omitted', () => {
    prepareTemplatesCache('1.3.0')

    const result = runVersion(['-V'], {
      FAKE_LATEST_HARNESS_VERSION: '0.9.0',
      FAKE_LATEST_TEMPLATE_VERSION: '1.3.0',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toBe('devkeel 0.9.0\ntemplates 1.3.0\n')
  })

  it('should download templates when the requested version is not cached', () => {
    const result = runVersion(['-V'], {
      FAKE_LATEST_HARNESS_VERSION: '0.9.0',
      FAKE_LATEST_TEMPLATE_VERSION: '1.4.0',
      FAKE_TEMPLATE_TARBALL: fakeTemplateTarball,
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toBe('devkeel 0.9.0\ntemplates 1.4.0\n')
    expect(fs.existsSync(path.join(
      tmpDir,
      '.harness',
      'cache',
      'devkeel-templates',
      '1.4.0',
      'package.json',
    ))).toBe(true)
  })

  it('should exit successfully with local version output when registry queries fail', () => {
    const result = runVersion(['-V'], { FAKE_NPM_FAIL: '1' })

    expect(result.status).toBe(0)
    expect(result.stdout).toBe(
      `devkeel ${harnessPackage.version}\ntemplates ${templatesPackage.version}\n`,
    )
  })
})
