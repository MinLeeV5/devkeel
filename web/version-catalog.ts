import fs from 'node:fs'
import path from 'node:path'

import {
  VERSION_STREAMS,
  validateVersionEntry,
  type VersionCatalogResponse,
  type VersionCatalogStream,
  type VersionEntry,
  type VersionStream,
} from './src/lib/version-catalog'

interface LoadedStream {
  entries: VersionEntry[]
  errors: string[]
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const nestedValue of Object.values(value)) deepFreeze(nestedValue)
  return value
}

function loadStream(versionsDir: string, stream: VersionStream): LoadedStream {
  const streamDir = path.join(versionsDir, stream)
  const entries: VersionEntry[] = []
  const errors: string[] = []

  let streamStats: fs.Stats
  try {
    streamStats = fs.statSync(streamDir)
  } catch (error) {
    return { entries, errors: [`${streamDir}: directory cannot be inspected (${formatFsError(error)})`] }
  }
  if (!streamStats.isDirectory()) {
    return { entries, errors: [`${streamDir}: not a directory`] }
  }

  let directoryEntries: fs.Dirent[]
  try {
    directoryEntries = fs.readdirSync(streamDir, { withFileTypes: true })
  } catch (error) {
    return { entries, errors: [`${streamDir}: directory cannot be read (${formatFsError(error)})`] }
  }

  const jsonFiles = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort()

  if (jsonFiles.length === 0) {
    errors.push(`${streamDir}: no JSON entries`)
    return { entries, errors }
  }

  for (const fileName of jsonFiles) {
    const filePath = path.join(streamDir, fileName)
    let value: unknown
    try {
      value = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
      errors.push(`${filePath}: invalid JSON (${error instanceof Error ? error.message : String(error)})`)
      continue
    }

    const result = validateVersionEntry(value, filePath)
    errors.push(...result.errors)
    if (!result.entry) continue

    const expectedFileName = `${result.entry.versions.at(-1)}.json`
    if (fileName !== expectedFileName) {
      errors.push(`${filePath}: filename mismatch, expected ${expectedFileName}`)
    }
    entries.push(result.entry)
  }

  const versionSources = new Map<string, string>()
  entries.forEach((entry) => {
    const fileName = `${entry.versions.at(-1)}.json`
    entry.versions.forEach((version) => {
      const previousSource = versionSources.get(version)
      if (previousSource) {
        errors.push(`${path.join(streamDir, fileName)}: duplicate version ${version}; already declared by ${previousSource}`)
      } else {
        versionSources.set(version, path.join(streamDir, fileName))
      }
    })
  })

  return { entries, errors }
}

function formatFsError(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sortEntries(entries: VersionEntry[]): VersionEntry[] {
  return [...entries].sort((left, right) => {
    const leftTimestamp = Date.parse(left.releasedAt.to ?? left.releasedAt.from)
    const rightTimestamp = Date.parse(right.releasedAt.to ?? right.releasedAt.from)
    return rightTimestamp - leftTimestamp
  })
}

function buildCatalogStream(entries: VersionEntry[]): VersionCatalogStream {
  const sortedEntries = sortEntries(entries)
  return {
    latest: sortedEntries[0]?.versions.at(-1) ?? '',
    entries: sortedEntries,
  }
}

export function loadVersionCatalog(versionsDir: string): VersionCatalogResponse {
  const loaded = Object.fromEntries(
    VERSION_STREAMS.map((stream) => [stream, loadStream(versionsDir, stream)]),
  ) as Record<VersionStream, LoadedStream>
  const errors = VERSION_STREAMS.flatMap((stream) => {
    const streamErrors = [...loaded[stream].errors]
    const latestEntry = sortEntries(loaded[stream].entries)[0]
    if (latestEntry?.archived) {
      streamErrors.push(
        `${path.join(versionsDir, stream)}: latest entry ${latestEntry.versions.at(-1)} must set archived to false`,
      )
    }
    return streamErrors
  })

  if (errors.length > 0) {
    throw new Error(`Invalid changelog version catalog:\n${errors.map((error) => `- ${error}`).join('\n')}`)
  }

  return deepFreeze({
    cli: buildCatalogStream(loaded.cli.entries),
    templates: buildCatalogStream(loaded.templates.entries),
  })
}
