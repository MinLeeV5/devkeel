import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { gt, valid } from 'semver'
import { readVersions } from './versions.js'

const PACKAGE_NAME = 'devkeel-templates'
const REGISTRY = 'https://registry.npmjs.org/'
const CACHE_TTL = 3 * 24 * 60 * 60 * 1000
const FETCH_TIMEOUT = 3000

function getCachePath(): string {
  return path.join(os.homedir(), '.harness', 'cache', 'devkeel-update-check.json')
}

export interface UpdateCache {
  lastCheck: number
  latestVersion: string
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

export function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('npm', ['view', `${PACKAGE_NAME}@latest`, 'version', `--registry=${REGISTRY}`, '--json'],
      { timeout: FETCH_TIMEOUT },
      (error, stdout) => {
        if (error) { resolve(null); return }
        try {
          const version = JSON.parse(stdout)
          if (typeof version === 'string' && version.length > 0) { resolve(version); return }
        } catch { /* fall through */ }
        resolve(null)
      },
    )
  })
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
  cachePath = getCachePath(),
): Promise<string | null> {
  try {
    const versions = readVersions(projectRoot)
    if (!versions) return null

    const currentVersion = versions.harness
    const cache = readUpdateCache(cachePath)

    let latestVersion: string | null = null

    if (cache && !isCacheExpired(cache)) {
      latestVersion = cache.latestVersion
    }

    if (!latestVersion) {
      latestVersion = await fetchLatestVersion()
      if (!latestVersion) return null

      writeUpdateCache({
        lastCheck: Date.now(),
        latestVersion,
      }, cachePath)
    }

    if (!compareVersions(currentVersion, latestVersion)) return null

    return formatUpdatePrompt(currentVersion, latestVersion)
  } catch {
    return null
  }
}
