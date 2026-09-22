import fs from 'node:fs'
import path from 'node:path'

const HARNESS_SECTION_HEADER = '# harness runtime'
const LEGACY_PLATFORM_ENTRIES = ['.claude', '.cursor', '.agents'] as const

export interface LegacyPlatformIgnorePlan {
  hasChanges: boolean
  originalContent: string
  updatedContent: string
  removedEntries: string[]
}

export function ensureGitignoreEntry(projectRoot: string, entry: string): boolean {
  const gitignorePath = path.join(projectRoot, '.gitignore')
  const content = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf-8')
    : ''

  const lines = content.split('\n')
  const normalizedEntry = entry.replace(/\/$/, '')

  const alreadyPresent = lines.some(line => {
    const trimmed = line.trim()
    return trimmed === entry || trimmed === normalizedEntry || trimmed === `${normalizedEntry}/`
  })

  if (alreadyPresent) return false

  const sectionIndex = lines.findIndex(line => line.trim() === HARNESS_SECTION_HEADER)

  if (sectionIndex >= 0) {
    lines.splice(sectionIndex + 1, 0, entry)
  } else {
    const suffix = content.endsWith('\n') || content === '' ? '' : '\n'
    const block = `${suffix}\n${HARNESS_SECTION_HEADER}\n${entry}\n`
    return writeGitignore(gitignorePath, content + block)
  }

  return writeGitignore(gitignorePath, lines.join('\n'))
}

export function planLegacyPlatformIgnores(projectRoot: string): LegacyPlatformIgnorePlan {
  const gitignorePath = path.join(projectRoot, '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    return {
      hasChanges: false,
      originalContent: '',
      updatedContent: '',
      removedEntries: [],
    }
  }

  const originalContent = fs.readFileSync(gitignorePath, 'utf-8')
  const lines = originalContent.split('\n')
  const removed: string[] = []

  const filtered = lines.filter(line => {
    const trimmed = line.trim()
    for (const entry of LEGACY_PLATFORM_ENTRIES) {
      if (trimmed === entry || trimmed === `${entry}/`) {
        removed.push(trimmed)
        return false
      }
    }
    return true
  })

  return {
    hasChanges: removed.length > 0,
    originalContent,
    updatedContent: filtered.join('\n'),
    removedEntries: removed,
  }
}

export function applyLegacyPlatformIgnorePlan(
  projectRoot: string,
  plan: LegacyPlatformIgnorePlan,
): string[] {
  if (!plan.hasChanges) return []

  const gitignorePath = path.join(projectRoot, '.gitignore')
  const currentContent = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf-8')
    : ''
  if (currentContent !== plan.originalContent) {
    throw new Error('.gitignore 在 update 规划后发生变化，请重新运行 devkeel update')
  }

  fs.writeFileSync(gitignorePath, plan.updatedContent, 'utf-8')
  return [...plan.removedEntries]
}

export function removeLegacyPlatformIgnores(projectRoot: string): string[] {
  return applyLegacyPlatformIgnorePlan(projectRoot, planLegacyPlatformIgnores(projectRoot))
}

function writeGitignore(filePath: string, content: string): boolean {
  fs.writeFileSync(filePath, content, 'utf-8')
  return true
}
