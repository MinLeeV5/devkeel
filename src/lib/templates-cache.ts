import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { extract } from 'tar'
import { execNpmSync } from './npm-command.js'

const PACKAGE_NAME = 'devkeel-templates'
const CACHE_ROOT = path.join(os.homedir(), '.harness', 'cache', 'devkeel-templates')
const META_FILE = 'meta.json'
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

export interface TemplatesCacheInfo {
  cacheDir: string
  version: string
}

export interface EnsureTemplatesCacheOptions {
  version?: string
  beta?: boolean
}

export class TemplatesFetchError extends Error {
  readonly diagnostic: string

  constructor(originalError: string) {
    super(`无法拉取 ${PACKAGE_NAME}：\n  ${originalError}`)
    this.name = 'TemplatesFetchError'
    this.diagnostic = [
      '请确认：',
      '  1. npm 已安装且在 PATH 中：',
      '     npm --version',
      '  2. npm registry 配置可访问公共 npm 包：',
      '     npm config get registry',
      '  3. 当前网络可访问 registry：',
      `     curl -I https://registry.npmjs.org/${encodeURIComponent(PACKAGE_NAME)}`,
      '  4. 模板包已发布到上述 registry（维护者首次发版后才可用）',
    ].join('\n')
  }
}

interface CacheMeta {
  version: string
  fetchedAt: string
}

function npmViewVersion(tag = 'latest'): string {
  let stdout: string
  try {
    stdout = execNpmSync(
      ['view', `${PACKAGE_NAME}@${tag}`, 'version', '--json'],
      { encoding: 'utf-8', timeout: 30_000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new TemplatesFetchError(msg)
  }

  try {
    const version = JSON.parse(stdout)
    if (typeof version !== 'string') {
      throw new TemplatesFetchError(`npm view 输出格式异常：${stdout.slice(0, 200)}`)
    }
    return version
  } catch (e) {
    if (e instanceof TemplatesFetchError) throw e
    throw new TemplatesFetchError(`npm view JSON 解析失败：${stdout.slice(0, 200)}`)
  }
}

function assertValidTemplateVersion(version: string): string {
  if (!SEMVER_RE.test(version)) {
    throw new TemplatesFetchError(`版本号格式异常：${version}`)
  }
  return version
}

function resolveRequestedTemplatesVersion(
  options: EnsureTemplatesCacheOptions = {},
  stableVersionResolver: () => string = npmViewVersion,
  betaVersionResolver: () => string = () => npmViewVersion('beta'),
): string {
  const requestedVersion = options.version?.trim()
  if (requestedVersion && options.beta) {
    throw new TemplatesFetchError('不能同时指定模板版本和 --beta')
  }

  if (requestedVersion) {
    return assertValidTemplateVersion(requestedVersion)
  }

  if (options.beta) {
    return assertValidTemplateVersion(betaVersionResolver())
  }

  return assertValidTemplateVersion(stableVersionResolver())
}

function readMeta(cacheRoot: string = CACHE_ROOT): CacheMeta | null {
  const metaPath = path.join(cacheRoot, META_FILE)
  if (!fs.existsSync(metaPath)) return null
  try {
    const content = fs.readFileSync(metaPath, 'utf-8')
    return JSON.parse(content) as CacheMeta
  } catch {
    return null
  }
}

function writeMeta(meta: CacheMeta, cacheRoot: string = CACHE_ROOT): void {
  fs.mkdirSync(cacheRoot, { recursive: true })
  const metaPath = path.join(cacheRoot, META_FILE)
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8')
}

function isUsableCacheDir(cacheDir: string, version: string): boolean {
  if (!fs.existsSync(cacheDir)) return false
  const packagePath = path.join(cacheDir, 'package.json')
  const versionsPath = path.join(cacheDir, 'versions-yml.yml')
  if (!fs.existsSync(packagePath) || !fs.existsSync(versionsPath)) return false
  try {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8')) as Record<string, unknown>
    return pkg['name'] === PACKAGE_NAME && pkg['version'] === version
  } catch {
    return false
  }
}

function npmPack(version: string, targetDir: string): string {
  if (!SEMVER_RE.test(version)) {
    throw new TemplatesFetchError(`版本号格式异常：${version}`)
  }
  fs.mkdirSync(targetDir, { recursive: true })
  let stdout: string
  try {
    stdout = execNpmSync(
      ['pack', `${PACKAGE_NAME}@${version}`],
      {
        cwd: targetDir,
        encoding: 'utf-8',
        timeout: 60_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new TemplatesFetchError(`npm pack 下载失败：${msg}`)
  }

  const filename = stdout.trim().split('\n').pop()
  if (!filename) {
    throw new TemplatesFetchError('npm pack 未返回文件名')
  }
  return path.join(targetDir, filename)
}

async function extractTarball(tarballPath: string, targetDir: string): Promise<void> {
  const tmpDir = targetDir + '.tmp'
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
  fs.mkdirSync(tmpDir, { recursive: true })

  await extract({
    file: tarballPath,
    cwd: tmpDir,
    strip: 1,
  })

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true })
  }
  fs.renameSync(tmpDir, targetDir)
}

export async function ensureTemplatesCache(options?: EnsureTemplatesCacheOptions): Promise<TemplatesCacheInfo> {
  const version = resolveRequestedTemplatesVersion(options)

  const versionDir = path.join(CACHE_ROOT, version)

  if (isUsableCacheDir(versionDir, version)) {
    writeMeta({ version, fetchedAt: new Date().toISOString() })
    return { cacheDir: versionDir, version }
  }
  if (fs.existsSync(versionDir)) {
    fs.rmSync(versionDir, { recursive: true, force: true })
  }

  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-tpl-'))
  try {
    const tarballPath = npmPack(version, downloadDir)
    await extractTarball(tarballPath, versionDir)
  } finally {
    fs.rmSync(downloadDir, { recursive: true, force: true })
  }

  writeMeta({ version, fetchedAt: new Date().toISOString() })

  return { cacheDir: versionDir, version }
}

export const __test__ = process.env['VITEST'] ? {
  readMeta,
  writeMeta,
  extractTarball,
  SEMVER_RE,
  isUsableCacheDir,
  resolveRequestedTemplatesVersion,
} : undefined
