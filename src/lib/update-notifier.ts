import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFile } from 'node:child_process'
import { readVersions } from './versions.js'
import { openTarget } from './open-target.js'

const PACKAGE_NAME = 'devkeel-templates'
const REGISTRY = 'https://registry.npmjs.org/'
const CACHE_TTL = 3 * 24 * 60 * 60 * 1000
const CHANGELOG_URL = 'https://github.com/MinLeeV5/devkeel/tree/HEAD/web/public/versions'
const FETCH_TIMEOUT = 3000

function getCachePath(): string {
  return path.join(os.homedir(), '.harness', 'cache', 'devkeel-update-check.json')
}

export interface UpdateCache {
  lastCheck: number
  latestVersion: string
  notifiedVersion?: string
}

export function readUpdateCache(): UpdateCache | null {
  if (!fs.existsSync(getCachePath())) return null
  try {
    const content = fs.readFileSync(getCachePath(), 'utf-8')
    const parsed = JSON.parse(content) as Record<string, unknown>
    if (typeof parsed['lastCheck'] !== 'number' || typeof parsed['latestVersion'] !== 'string') {
      return null
    }
    return {
      lastCheck: parsed['lastCheck'],
      latestVersion: parsed['latestVersion'],
      notifiedVersion: typeof parsed['notifiedVersion'] === 'string' ? parsed['notifiedVersion'] : undefined,
    }
  } catch {
    return null
  }
}

export function isCacheExpired(cache: UpdateCache): boolean {
  return Date.now() - cache.lastCheck > CACHE_TTL
}

export function writeUpdateCache(cache: UpdateCache): void {
  const cachePath = getCachePath()
  fs.mkdirSync(path.dirname(cachePath), { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8')
}

export function compareVersions(current: string, latest: string): boolean {
  return latest !== current
}

export function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('npm', ['view', PACKAGE_NAME, 'version', `--registry=${REGISTRY}`, '--json'],
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
  const lines = [
    `┌${'─'.repeat(50)}┐`,
    `│  ${' '.repeat(46)}│`,
    `│  DevKeel 有新版本可用！${' '.repeat(25)}│`,
    `│  ${' '.repeat(46)}│`,
    `│  当前版本: ${from.padEnd(36)}│`,
    `│  最新版本: ${to.padEnd(36)}│`,
    `│  ${' '.repeat(46)}│`,
    `│  执行 <devkeel update> 升级到最新版本${' '.repeat(11)}│`,
    `│  ${' '.repeat(46)}│`,
    `└${'─'.repeat(50)}┘`,
  ]
  return lines.join('\n')
}

export function openBrowser(url: string): void {
  void openTarget(url)
}

export function shouldOpenBrowser(cache: UpdateCache | null, latestVersion: string): boolean {
  if (!cache) return true
  return cache.notifiedVersion !== latestVersion
}

export async function checkAndNotify(): Promise<string | null> {
  try {
    const versions = readVersions(process.cwd())
    if (!versions) return null

    const currentVersion = versions.harness
    const cache = readUpdateCache()

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
        notifiedVersion: cache?.notifiedVersion,
      })
    }

    if (!compareVersions(currentVersion, latestVersion)) return null

    const prompt = formatUpdatePrompt(currentVersion, latestVersion)

    if (shouldOpenBrowser(cache, latestVersion)) {
      const url = `${CHANGELOG_URL}?from=${encodeURIComponent(currentVersion)}`
      openBrowser(url)
      writeUpdateCache({
        lastCheck: cache?.lastCheck ?? Date.now(),
        latestVersion,
        notifiedVersion: latestVersion,
      })
    }

    return prompt
  } catch {
    return null
  }
}

export const __test__ = process.env['VITEST'] ? {
  readUpdateCache,
  writeUpdateCache,
  isCacheExpired,
  compareVersions,
  formatUpdatePrompt,
  shouldOpenBrowser,
} : undefined
