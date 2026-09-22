export const VERSION_STREAMS = ['cli', 'templates'] as const
export const CHANGE_TYPES = ['feat', 'fix', 'breaking', 'refactor', 'docs'] as const

export type VersionStream = (typeof VERSION_STREAMS)[number]
export type ChangeType = (typeof CHANGE_TYPES)[number]

export interface ChangeItem {
  name: string
  description: string
}

export interface ChangeGroup {
  type: ChangeType
  label: string
  items: ChangeItem[]
}

export interface VersionEntry {
  versions: string[]
  releasedAt: {
    from: string
    to?: string
  }
  title: string
  archived: boolean
  groups: ChangeGroup[]
}

export interface VersionCatalogStream {
  latest: string
  entries: VersionEntry[]
}

export interface VersionCatalogResponse {
  cli: VersionCatalogStream
  templates: VersionCatalogStream
}

export interface VersionEntryValidationResult {
  entry?: VersionEntry
  errors: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isTimestampWithTimezone(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6] ?? '0')
  const offsetHour = Number(match[8] ?? '0')
  const offsetMinute = Number(match[9] ?? '0')
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  return (
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth[month - 1]! &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    (offsetHour < 14 || (offsetHour === 14 && offsetMinute === 0)) &&
    offsetMinute <= 59 &&
    !Number.isNaN(Date.parse(value))
  )
}

function addError(errors: string[], sourcePath: string, field: string, message: string): void {
  errors.push(`${sourcePath}: ${field} ${message}`)
}

function isNumericDottedVersion(value: string): boolean {
  return /^\d+(?:\.\d+)+$/.test(value)
}

function compareNumericDottedVersions(left: string, right: string): number {
  const leftSegments = left.split('.').map((segment) => BigInt(segment))
  const rightSegments = right.split('.').map((segment) => BigInt(segment))
  const segmentCount = Math.max(leftSegments.length, rightSegments.length)

  for (let index = 0; index < segmentCount; index += 1) {
    const leftSegment = leftSegments[index] ?? 0n
    const rightSegment = rightSegments[index] ?? 0n
    if (leftSegment < rightSegment) return -1
    if (leftSegment > rightSegment) return 1
  }
  return 0
}

export function validateVersionEntry(
  value: unknown,
  sourcePath: string,
): VersionEntryValidationResult {
  const errors: string[] = []

  if (!isRecord(value)) {
    return { errors: [`${sourcePath}: root must be an object`] }
  }

  const versions = value['versions']
  if (!Array.isArray(versions) || versions.length === 0) {
    addError(errors, sourcePath, 'versions', 'must be a non-empty array')
  } else {
    const seenVersions = new Set<string>()
    let previousVersion: string | undefined
    versions.forEach((version, index) => {
      if (!isNonEmptyString(version)) {
        addError(errors, sourcePath, `versions[${index}]`, 'must be a non-empty string')
      } else if (!isNumericDottedVersion(version)) {
        addError(errors, sourcePath, `versions[${index}]`, 'must be a numeric dotted version')
      } else if (seenVersions.has(version)) {
        addError(errors, sourcePath, `versions[${index}]`, `duplicates version ${version}`)
      } else {
        if (previousVersion && compareNumericDottedVersions(previousVersion, version) >= 0) {
          addError(errors, sourcePath, `versions[${index}]`, `must be strictly old to new after ${previousVersion}`)
        }
        seenVersions.add(version)
        previousVersion = version
      }
    })
  }

  const releasedAt = value['releasedAt']
  if (!isRecord(releasedAt)) {
    addError(errors, sourcePath, 'releasedAt', 'must be an object')
  } else {
    const from = releasedAt['from']
    const to = releasedAt['to']
    if (!isTimestampWithTimezone(from)) {
      addError(errors, sourcePath, 'releasedAt.from', 'must be a valid ISO timestamp with timezone')
    }
    if (to !== undefined && !isTimestampWithTimezone(to)) {
      addError(errors, sourcePath, 'releasedAt.to', 'must be a valid ISO timestamp with timezone')
    }
    if (isTimestampWithTimezone(from) && isTimestampWithTimezone(to) && Date.parse(to) < Date.parse(from)) {
      addError(errors, sourcePath, 'releasedAt.to', 'must not be earlier than releasedAt.from')
    }
  }

  if (!isNonEmptyString(value['title'])) {
    addError(errors, sourcePath, 'title', 'must be a non-empty string')
  }
  if (typeof value['archived'] !== 'boolean') {
    addError(errors, sourcePath, 'archived', 'must be a boolean')
  }

  const groups = value['groups']
  if (!Array.isArray(groups)) {
    addError(errors, sourcePath, 'groups', 'must be an array')
  } else {
    groups.forEach((group, groupIndex) => {
      const groupPath = `groups[${groupIndex}]`
      if (!isRecord(group)) {
        addError(errors, sourcePath, groupPath, 'must be an object')
        return
      }

      if (!CHANGE_TYPES.includes(group['type'] as ChangeType)) {
        addError(errors, sourcePath, `${groupPath}.type`, `contains unsupported value ${String(group['type'])}`)
      }
      if (!isNonEmptyString(group['label'])) {
        addError(errors, sourcePath, `${groupPath}.label`, 'must be a non-empty string')
      }

      const items = group['items']
      if (!Array.isArray(items)) {
        addError(errors, sourcePath, `${groupPath}.items`, 'must be an array')
        return
      }
      items.forEach((item, itemIndex) => {
        const itemPath = `${groupPath}.items[${itemIndex}]`
        if (!isRecord(item)) {
          addError(errors, sourcePath, itemPath, 'must be an object')
          return
        }
        if (!isNonEmptyString(item['name'])) {
          addError(errors, sourcePath, `${itemPath}.name`, 'must be a non-empty string')
        }
        if (!isNonEmptyString(item['description'])) {
          addError(errors, sourcePath, `${itemPath}.description`, 'must be a non-empty string')
        }
      })
    })
  }

  if (errors.length > 0) return { errors }
  return { entry: value as unknown as VersionEntry, errors }
}

export function formatVersionLabel(versions: string[]): string {
  return versions.map((version) => `v${version}`).join(' ~ ')
}

export function getVersionSectionId(stream: VersionStream, versions: string[]): string {
  const latestVersion = versions.at(-1) ?? ''
  return stream === 'templates' ? `tpl-v${latestVersion}` : `v${latestVersion}`
}

function formatTimestamp(timestamp: string): string {
  return timestamp.slice(0, 16).replace('T', ' ')
}

export function formatReleaseDateLabel(releasedAt: VersionEntry['releasedAt']): string {
  const from = formatTimestamp(releasedAt.from)
  return releasedAt.to ? `${from} ~ ${formatTimestamp(releasedAt.to)}` : from
}
