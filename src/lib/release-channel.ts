import { execNpmSync } from './npm-command.js'

const PACKAGE_NAME = 'devkeel'

export type ReleaseChannel = 'latest' | 'beta'

export function getPublishedHarnessVersion(
  channel: ReleaseChannel,
  fallbackVersion: string,
): string {
  try {
    const stdout = execNpmSync(
      ['view', `${PACKAGE_NAME}@${channel}`, 'version', '--json'],
      { encoding: 'utf-8', timeout: 30_000, stdio: ['pipe', 'pipe', 'pipe'] },
    )
    const parsed = JSON.parse(stdout) as unknown
    return typeof parsed === 'string' ? parsed : fallbackVersion
  } catch {
    return fallbackVersion
  }
}
