import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const webPackageJson = JSON.parse(fs.readFileSync(path.join(WEB_DIR, 'package.json'), 'utf8'))

describe('application package command', () => {
  it('exposes one stable package command for external build systems', () => {
    expect(webPackageJson.scripts['package:app']).toBe('node scripts/package-app.js')
  })

  it('keeps the packaging implementation in a dedicated script', () => {
    expect(fs.existsSync(path.join(WEB_DIR, 'scripts', 'package-app.js'))).toBe(true)
  })

  it('declares the complete runtime file set', async () => {
    const packageApp = await import('../scripts/package-app.js')

    expect(packageApp.APP_ARCHIVE_ENTRIES).toEqual([
      'dist',
      'package.json',
      'server.ts',
      'page-redirects.ts',
      'version-catalog.ts',
      'src/lib/version-catalog.ts',
      'node_modules',
      'version.json',
    ])
  })

  it('provides version file generation as a testable operation', async () => {
    const packageApp = await import('../scripts/package-app.js')

    expect(packageApp.writeVersionFile).toBeTypeOf('function')
  })

  it('generates version.json from the root package version', async () => {
    const packageApp = await import('../scripts/package-app.js')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-package-app-'))
    const sourceFile = path.join(tmpDir, 'package.json')
    const targetFile = path.join(tmpDir, 'version.json')

    try {
      fs.writeFileSync(sourceFile, JSON.stringify({ version: '9.8.7' }))
      packageApp.writeVersionFile(sourceFile, targetFile)

      expect(fs.existsSync(targetFile)).toBe(true)
      expect(JSON.parse(fs.readFileSync(targetFile, 'utf8'))).toEqual({ version: '9.8.7' })
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('provides packaging orchestration as a testable operation', async () => {
    const packageApp = await import('../scripts/package-app.js')

    expect(packageApp.createAppPackage).toBeTypeOf('function')
  })

  it('builds and packages the declared runtime files into the repository root', async () => {
    const packageApp = await import('../scripts/package-app.js')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-package-app-'))
    const repositoryDir = path.join(tmpDir, 'repository')
    const webDir = path.join(repositoryDir, 'web')
    const commands = []

    try {
      fs.mkdirSync(path.join(webDir, 'dist'), { recursive: true })
      fs.mkdirSync(path.join(webDir, 'node_modules'), { recursive: true })
      fs.mkdirSync(path.join(webDir, 'src', 'lib'), { recursive: true })
      fs.writeFileSync(path.join(repositoryDir, 'package.json'), JSON.stringify({ version: '9.8.7' }))
      fs.writeFileSync(path.join(webDir, 'package.json'), '{}')
      fs.writeFileSync(path.join(webDir, 'server.ts'), '')
      fs.writeFileSync(path.join(webDir, 'page-redirects.ts'), '')
      fs.writeFileSync(path.join(webDir, 'version-catalog.ts'), '')
      fs.writeFileSync(path.join(webDir, 'src', 'lib', 'version-catalog.ts'), '')

      packageApp.createAppPackage({
        repositoryDir,
        webDir,
        runCommand(command, args, cwd) {
          commands.push({ command, args, cwd })
          if (command === 'tar') fs.writeFileSync(args[1], 'archive')
        },
      })

      expect(commands).toEqual([
        { command: 'pnpm', args: ['build'], cwd: webDir },
        {
          command: 'tar',
          args: ['-zcf', path.join(webDir, 'app.tar.gz.tmp'), ...packageApp.APP_ARCHIVE_ENTRIES],
          cwd: webDir,
        },
      ])
      expect(JSON.parse(fs.readFileSync(path.join(webDir, 'version.json'), 'utf8'))).toEqual({ version: '9.8.7' })
      expect(fs.readFileSync(path.join(repositoryDir, 'app.tar.gz'), 'utf8')).toBe('archive')
      expect(fs.existsSync(path.join(webDir, 'app.tar.gz.tmp'))).toBe(false)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('fails before archiving when a runtime file is missing', async () => {
    const packageApp = await import('../scripts/package-app.js')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-package-app-'))
    const repositoryDir = path.join(tmpDir, 'repository')
    const webDir = path.join(repositoryDir, 'web')
    const commands = []

    try {
      fs.mkdirSync(path.join(webDir, 'dist'), { recursive: true })
      fs.mkdirSync(path.join(webDir, 'node_modules'), { recursive: true })
      fs.mkdirSync(path.join(webDir, 'src', 'lib'), { recursive: true })
      fs.writeFileSync(path.join(repositoryDir, 'package.json'), JSON.stringify({ version: '9.8.7' }))
      fs.writeFileSync(path.join(webDir, 'package.json'), '{}')
      fs.writeFileSync(path.join(webDir, 'server.ts'), '')
      fs.writeFileSync(path.join(webDir, 'page-redirects.ts'), '')
      fs.writeFileSync(path.join(webDir, 'version-catalog.ts'), '')

      expect(() => packageApp.createAppPackage({
        repositoryDir,
        webDir,
        runCommand(command, args, cwd) {
          commands.push({ command, args, cwd })
        },
      })).toThrowError(/Missing application package entries:\n- src\/lib\/version-catalog\.ts/)
      expect(commands).toEqual([{ command: 'pnpm', args: ['build'], cwd: webDir }])
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
