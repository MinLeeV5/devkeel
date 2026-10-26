import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { gt, valid } from 'semver'
import { readVersions } from './versions.js'
import { execNpm } from './npm-command.js'
import { resolveTemplateSource, templateRegistryArgs, templateSourceKey, type TemplateSource } from './template-source.js'

const CACHE_TTL = 3 * 24 * 60 * 60 * 1000
const FETCH_TIMEOUT = 3000

function getCachePath(): string {
  return path.join(os.homedir(), '.harness', 'cache', 'devkeel-update-check.json')
}

export interface UpdateCache {
  lastCheck: number
  latestVersion: string
  sourceKey?: string
}

export function readUpdateCache(cachePath = getCachePath()): UpdateCache | null {
  if (!fs.existsSync(cachePath)) return null
  try {
    const content = fs.readFileSync(cachePath, 'utf-8')
    const parsed = JSON.parse(content) as Record<string, unknown>
    if (typeof parsed['lastCheck'] !== 'number' || typeof parsed['latestVersion'] !== 'string') {
      return null
    }
    return {
      lastCheck: parsed['lastCheck'],
      latestVersion: parsed['latestVersion'],
      ...(typeof parsed['sourceKey'] === 'string' ? { sourceKey: parsed['sourceKey'] } : {}),
    }
  } catch {
    return null
  }
}

export function isCacheExpired(cache: UpdateCache): boolean {
  return Date.now() - cache.lastCheck > CACHE_TTL
}

export function writeUpdateCache(cache: UpdateCache, cachePath = getCachePath()): void {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8')
}

export function compareVersions(current: string, latest: string): boolean {
  const currentVersion = valid(current)
  const latestVersion = valid(latest)
  return currentVersion !== null && latestVersion !== null && gt(latestVersion, currentVersion)
}

export async function fetchLatestVersion(
  source: TemplateSource,
  projectRoot = process.cwd(),
): Promise<string | null> {
  try {
    const stdout = await execNpm(
      ['view', `${source.packageName}@latest`, 'version', ...templateRegistryArgs(source), '--json'],
      { cwd: projectRoot, timeout: FETCH_TIMEOUT },
    )
    const version: unknown = JSON.parse(stdout)
    return typeof version === 'string' && valid(version) ? version : null
  } catch { return null }
}

export function formatUpdatePrompt(from: string, to: string): string {
  return [
    'DevKeel 模板有新版本可用',
    `当前模板版本: ${from}`,
    `最新模板版本: ${to}`,
    '执行 devkeel update 更新项目模板。',
  ].join('\n')
}

export async function checkAndNotify(
  projectRoot = process.cwd(),
  cachePath?: string,
): Promise<string | null> {
  try {
    const versions = readVersions(projectRoot)
    if (!versions) return null

    const source = resolveTemplateSource(projectRoot)
    const sourceKey = templateSourceKey(source)
    const sourceCachePath = cachePath ?? path.join(path.dirname(getCachePath()), `devkeel-update-check-${sourceKey}.json`)

    const currentVersion = versions.harness
    const cache = readUpdateCache(sourceCachePath)

    let latestVersion: string | null = null

    if (cache?.sourceKey === sourceKey && !isCacheExpired(cache)) {
      latestVersion = cache.latestVersion
    }

    if (!latestVersion) {
      latestVersion = await fetchLatestVersion(source, projectRoot)
      if (!latestVersion) return null

      writeUpdateCache({
        lastCheck: Date.now(),
        latestVersion,
        sourceKey,
      }, sourceCachePath)
    }

    if (!compareVersions(currentVersion, latestVersion)) return null

    return formatUpdatePrompt(currentVersion, latestVersion)
  } catch {
    return null
  }
}
