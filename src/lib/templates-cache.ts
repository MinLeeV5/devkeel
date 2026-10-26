import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { extract } from 'tar'
import { execNpm, execNpmSync } from './npm-command.js'
import { resolveTemplateSource, templateRegistryArgs, templateSourceKey, type TemplateSource } from './template-source.js'

const DEFAULT_PACKAGE_NAME = 'devkeel-templates'
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
  source?: TemplateSource
  projectRoot?: string
}

export class TemplatesFetchError extends Error {
  readonly diagnostic: string

  constructor(originalError: string, source: TemplateSource = { packageName: DEFAULT_PACKAGE_NAME, registry: 'https://registry.npmjs.org/' }) {
    super(`无法拉取 ${source.packageName}（${source.registry}）：\n  ${originalError}`)
    this.name = 'TemplatesFetchError'
    this.diagnostic = [
      '请确认：',
      '  1. npm 已安装且在 PATH 中：',
      '     npm --version',
      '  2. npm registry 配置可访问：',
      '     npm config get registry',
      `     包：${source.packageName}`,
      `     Registry：${source.registry}`,
      '  3. 当前网络可访问所选 registry，且模板包已发布。',
    ].join('\n')
  }
}

interface CacheMeta {
  version: string
  fetchedAt: string
}

function npmViewVersion(source: TemplateSource, projectRoot: string, tag = 'latest'): string {
  let stdout: string
  try {
    stdout = execNpmSync(
      ['view', `${source.packageName}@${tag}`, 'version', '--json', ...templateRegistryArgs(source)],
      { cwd: projectRoot, encoding: 'utf-8', timeout: 30_000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
  } catch {
    throw new TemplatesFetchError('npm view 查询失败。', source)
  }
  try {
    const version = JSON.parse(stdout)
    if (typeof version !== 'string') throw new Error('invalid version type')
    return version
  } catch {
    throw new TemplatesFetchError('npm view 返回了无效版本信息。', source)
  }
}

function assertValidTemplateVersion(version: string, source?: TemplateSource): string {
  if (!SEMVER_RE.test(version)) throw new TemplatesFetchError(`版本号格式异常：${version}`, source)
  return version
}

function resolveRequestedTemplatesVersion(
  options: EnsureTemplatesCacheOptions = {},
  stableVersionResolver?: () => string,
  betaVersionResolver?: () => string,
): string {
  const projectRoot = options.projectRoot ?? process.cwd()
  const source = options.source ?? ((stableVersionResolver && betaVersionResolver)
    ? undefined
    : resolveTemplateSource(projectRoot))
  const stable = stableVersionResolver ?? (() => npmViewVersion(source!, projectRoot))
  const beta = betaVersionResolver ?? (() => npmViewVersion(source!, projectRoot, 'beta'))
  const requestedVersion = options.version?.trim()
  if (requestedVersion && options.beta) throw new TemplatesFetchError('不能同时指定模板版本和 --beta', source)
  if (requestedVersion) return assertValidTemplateVersion(requestedVersion, source)
  if (options.beta) return assertValidTemplateVersion(beta(), source)
  return assertValidTemplateVersion(stable(), source)
}

function readMeta(cacheRoot: string = CACHE_ROOT): CacheMeta | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(cacheRoot, META_FILE), 'utf-8')) as CacheMeta
  } catch { return null }
}

function writeMeta(meta: CacheMeta, cacheRoot: string = CACHE_ROOT): void {
  fs.mkdirSync(cacheRoot, { recursive: true })
  fs.writeFileSync(path.join(cacheRoot, META_FILE), JSON.stringify(meta, null, 2), 'utf-8')
}

function isUsableCacheDir(cacheDir: string, version: string, packageName = DEFAULT_PACKAGE_NAME): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cacheDir, 'package.json'), 'utf-8')) as Record<string, unknown>
    return pkg['name'] === packageName && pkg['version'] === version && fs.statSync(path.join(cacheDir, 'versions-yml.yml')).isFile()
  } catch { return false }
}

async function npmPack(source: TemplateSource, version: string, targetDir: string, projectRoot: string): Promise<string> {
  assertValidTemplateVersion(version, source)
  fs.mkdirSync(targetDir, { recursive: true })
  try {
    const stdout = await execNpm(
      ['pack', `${source.packageName}@${version}`, '--pack-destination', targetDir, '--ignore-scripts', ...templateRegistryArgs(source)],
      { cwd: projectRoot, encoding: 'utf-8', timeout: 60_000, maxBuffer: 1024 * 1024 },
    )
    const filename = stdout.trim().split(/\r?\n/).pop()
    if (!filename) throw new Error('no pack filename')
    const tarball = path.resolve(targetDir, filename)
    if (!tarball.startsWith(path.resolve(targetDir) + path.sep) || !fs.existsSync(tarball)) throw new Error('invalid pack path')
    return tarball
  } catch {
    throw new TemplatesFetchError('npm pack 下载失败。', source)
  }
}

async function extractTarball(tarballPath: string, targetDir: string): Promise<void> {
  const tmpDir = targetDir + '.tmp'
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true })
  fs.mkdirSync(tmpDir, { recursive: true })
  try {
    await extract({ file: tarballPath, cwd: tmpDir, strip: 1 })
    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true })
    fs.renameSync(tmpDir, targetDir)
  } catch (error) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    throw error
  }
}

export async function ensureTemplatesCache(options: EnsureTemplatesCacheOptions = {}): Promise<TemplatesCacheInfo> {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const source = options.source ?? resolveTemplateSource(projectRoot)
  const version = resolveRequestedTemplatesVersion({ ...options, source, projectRoot })
  const sourceRoot = path.join(CACHE_ROOT, templateSourceKey(source))
  const versionDir = path.join(sourceRoot, version)
  if (isUsableCacheDir(versionDir, version, source.packageName)) {
    writeMeta({ version, fetchedAt: new Date().toISOString() }, sourceRoot)
    return { cacheDir: versionDir, version }
  }
  if (fs.existsSync(versionDir)) fs.rmSync(versionDir, { recursive: true, force: true })
  const downloadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-tpl-'))
  try {
    const tarballPath = await npmPack(source, version, downloadDir, projectRoot)
    await extractTarball(tarballPath, versionDir)
    if (!isUsableCacheDir(versionDir, version, source.packageName)) {
      fs.rmSync(versionDir, { recursive: true, force: true })
      throw new TemplatesFetchError('下载的模板包名称、版本或 versions-yml.yml 不匹配。', source)
    }
  } finally {
    fs.rmSync(downloadDir, { recursive: true, force: true })
  }
  writeMeta({ version, fetchedAt: new Date().toISOString() }, sourceRoot)
  return { cacheDir: versionDir, version }
}

export const __test__ = process.env['VITEST'] ? {
  readMeta, writeMeta, extractTarball, SEMVER_RE, isUsableCacheDir,
  resolveRequestedTemplatesVersion,
} : undefined
