import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { afterEach, describe, expect, it } from 'vitest'

import { loadVersionCatalog } from '../version-catalog'
import type { VersionCatalogResponse, VersionEntry, VersionStream } from '../src/lib/version-catalog'

const VERSIONS_DIR = fileURLToPath(new URL('../public/versions', import.meta.url))
const RAW_HTML_PATTERN = /<(?:!--[\s\S]*?--|!doctype\b[^>]*|\/?[A-Za-z][^<>]*|\?[^<>]*)>/i

const HISTORICAL_FILES: Record<VersionStream, string[]> = {
  templates: [
    '1.0.0.json',
    '1.0.1.json',
    '1.0.2.json',
    '1.0.3.json',
    '1.0.4.json',
    '1.0.5.json',
    '1.1.1.json',
    '1.2.1.json',
    '1.2.3.json',
    '1.2.4.json',
    '1.2.5.json',
  ],
  cli: [
    '0.1.json',
    '0.2.0.json',
    '0.2.1.json',
    '0.2.2.json',
    '0.2.3.json',
    '0.2.4.json',
    '0.2.5.json',
    '0.2.6.json',
    '0.2.7.json',
    '0.3.0.json',
    '0.3.1.json',
    '0.3.6.json',
    '0.4.0.json',
    '0.4.3.json',
    '0.4.5.json',
    '0.5.2.json',
    '0.5.5.json',
    '0.5.9.json',
    '0.6.1.json',
    '0.7.0.json',
    '0.7.1.json',
    '0.8.4.json',
    '0.8.6.json',
    '0.8.7.json',
    '0.8.8.json',
    '0.8.9.json',
    '0.8.10.json',
  ].sort(),
}

const EXPECTED_VERSIONS: Record<VersionStream, string[]> = {
  templates: [
    '1.0.0',
    '1.0.1',
    '1.0.2',
    '1.0.3',
    '1.0.4',
    '1.0.5',
    '1.1.0',
    '1.1.1',
    '1.2.0',
    '1.2.1',
    '1.2.2',
    '1.2.3',
    '1.2.4',
    '1.2.5',
  ],
  cli: [
    '0.1',
    ...Array.from({ length: 8 }, (_, index) => `0.2.${index}`),
    ...Array.from({ length: 7 }, (_, index) => `0.3.${index}`),
    ...Array.from({ length: 6 }, (_, index) => `0.4.${index}`),
    ...Array.from({ length: 8 }, (_, index) => `0.5.${index + 2}`),
    '0.6.0',
    '0.6.1',
    '0.7.0',
    '0.7.1',
    ...Array.from({ length: 11 }, (_, index) => `0.8.${index}`),
  ],
}

const EXPECTED_MERGED_VERSIONS: Record<VersionStream, Record<string, string[]>> = {
  templates: {
    '1.1.1': ['1.1.0', '1.1.1'],
    '1.2.1': ['1.2.0', '1.2.1'],
    '1.2.3': ['1.2.2', '1.2.3'],
  },
  cli: {
    '0.3.6': ['0.3.2', '0.3.3', '0.3.4', '0.3.5', '0.3.6'],
    '0.4.3': ['0.4.1', '0.4.2', '0.4.3'],
    '0.4.5': ['0.4.4', '0.4.5'],
    '0.5.5': ['0.5.3', '0.5.4', '0.5.5'],
    '0.5.9': ['0.5.6', '0.5.7', '0.5.8', '0.5.9'],
    '0.6.1': ['0.6.0', '0.6.1'],
    '0.8.4': ['0.8.0', '0.8.1', '0.8.2', '0.8.3', '0.8.4'],
    '0.8.6': ['0.8.5', '0.8.6'],
  },
}

const EXPECTED_ARCHIVED_CLI_ENTRIES = [
  '0.6.1',
  '0.5.9',
  '0.5.5',
  '0.5.2',
  '0.4.5',
  '0.4.3',
  '0.4.0',
  '0.3.6',
  '0.3.1',
  '0.3.0',
  '0.2.7',
  '0.2.6',
  '0.2.5',
  '0.2.4',
  '0.2.3',
  '0.2.2',
  '0.2.1',
  '0.2.0',
  '0.1',
]

function listJsonFiles(root: string, stream: VersionStream): string[] {
  return fs
    .readdirSync(path.join(root, stream), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort()
}

function findEntry(catalog: VersionCatalogResponse, stream: VersionStream, latestVersion: string): VersionEntry {
  const entry = catalog[stream].entries.find((candidate) => candidate.versions.at(-1) === latestVersion)
  if (!entry) throw new Error(`Missing ${stream} entry ${latestVersion}`)
  return entry
}

function normalizeHistoricalBaseline(catalog: VersionCatalogResponse): Record<VersionStream, { entries: VersionEntry[] }> {
  const normalizeEntry = (entry: VersionEntry): VersionEntry => ({
    versions: [...entry.versions],
    releasedAt: entry.releasedAt.to
      ? { from: entry.releasedAt.from, to: entry.releasedAt.to }
      : { from: entry.releasedAt.from },
    title: entry.title,
    archived: entry.archived,
    groups: entry.groups.map((group) => ({
      type: group.type,
      label: group.label,
      items: group.items.map((item) => ({
        name: item.name,
        description: item.description,
      })),
    })),
  })

  return {
    cli: {
      entries: catalog.cli.entries
        .filter((entry) => HISTORICAL_FILES.cli.includes(`${entry.versions.at(-1)}.json`))
        .map(normalizeEntry),
    },
    templates: {
      entries: catalog.templates.entries
        .filter((entry) => HISTORICAL_FILES.templates.includes(`${entry.versions.at(-1)}.json`))
        .map(normalizeEntry),
    },
  }
}

function findRawHtml(markdown: string): string | undefined {
  const withoutInlineCode = markdown.replace(/`[^`\n]*`/g, '')
  return withoutInlineCode.match(RAW_HTML_PATTERN)?.[0]
}

function assertHistoricalBaseline(root: string): VersionCatalogResponse {
  const catalog = loadVersionCatalog(root)

  for (const stream of ['cli', 'templates'] as const) {
    const files = listJsonFiles(root, stream)
    const missingFiles = HISTORICAL_FILES[stream].filter((fileName) => !files.includes(fileName))
    if (missingFiles.length > 0) {
      throw new Error(`${stream} historical migration files are missing: ${missingFiles.join(', ')}`)
    }
    if (new Set(files).size !== files.length) {
      throw new Error(`${stream} contains duplicate filenames`)
    }
  }

  return catalog
}

describe('migrated changelog data', () => {
  let tmpDir: string | undefined

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true })
    tmpDir = undefined
  })

  it('loads all 38 historical migration files without forbidding future entries', () => {
    const catalog = assertHistoricalBaseline(VERSIONS_DIR)
    const historicalCatalog = normalizeHistoricalBaseline(catalog)

    expect(historicalCatalog.templates.entries).toHaveLength(11)
    expect(historicalCatalog.cli.entries).toHaveLength(27)
    expect(catalog.templates.entries.length).toBeGreaterThanOrEqual(11)
    expect(catalog.cli.entries.length).toBeGreaterThanOrEqual(27)

    for (const stream of ['cli', 'templates'] as const) {
      const versions = historicalCatalog[stream].entries.flatMap((entry) => entry.versions).sort()
      expect(versions).toEqual([...EXPECTED_VERSIONS[stream]].sort())
      expect(new Set(versions).size).toBe(versions.length)

      for (const [latestVersion, mergedVersions] of Object.entries(EXPECTED_MERGED_VERSIONS[stream])) {
        expect(findEntry(catalog, stream, latestVersion).versions).toEqual(mergedVersions)
      }
    }

    expect(historicalCatalog.templates.entries.every((entry) => !entry.archived)).toBe(true)
    expect(
      historicalCatalog.cli.entries
        .filter((entry) => entry.archived)
        .map((entry) => entry.versions.at(-1)),
    ).toEqual(EXPECTED_ARCHIVED_CLI_ENTRIES)
    expect(historicalCatalog.cli.entries.filter((entry) => !entry.archived)).toHaveLength(8)
  })

  it('matches the approved full-field and ordered snapshot for every historical group and item', () => {
    expect(normalizeHistoricalBaseline(assertHistoricalBaseline(VERSIONS_DIR))).toMatchSnapshot()
  })

  it('preserves migrated content, Markdown semantics and empty legacy groups', () => {
    const catalog = loadVersionCatalog(VERSIONS_DIR)
    const latestTemplate = findEntry(catalog, 'templates', '1.2.5')
    const latestCli = findEntry(catalog, 'cli', '0.8.10')

    expect(latestTemplate.title).toBe('技术方案按领域聚焦，评审图表按需生成')
    expect(latestTemplate.groups.flatMap((group) => group.items).map((item) => item.name)).toContain(
      'human-review 图表按需生成',
    )
    expect(latestCli.groups.flatMap((group) => group.items)).toContainEqual(
      expect.objectContaining({
        name: '跨平台打开 human-review',
        description: expect.stringContaining('`npx devkeel@latest open-review <html-path>`'),
      }),
    )

    const linkedItem = findEntry(catalog, 'cli', '0.3.1').groups
      .flatMap((group) => group.items)
      .find((item) => item.name === '领域包文档')
    expect(linkedItem?.description).toContain('[查看](./architecture.html#domain-packages)')
    expect(findEntry(catalog, 'cli', '0.7.0').groups[1]?.items[0]?.description).toContain('\n`registry=')
    expect(findEntry(catalog, 'cli', '0.2.6').groups).toEqual([])

    const markdownFields = [catalog.cli, catalog.templates].flatMap((stream) =>
      stream.entries.flatMap((entry) => [
        entry.title,
        ...entry.groups.flatMap((group) => [
          group.label,
          ...group.items.flatMap((item) => [item.name, item.description]),
        ]),
      ]),
    )
    for (const field of markdownFields) {
      expect(findRawHtml(field), `raw HTML found in: ${field}`).toBeUndefined()
    }
    expect(findRawHtml('`<style>` and `<html-path>` are inline code')).toBeUndefined()
    expect(findRawHtml('<custom-element data-kind="raw">content</custom-element>')).toBe(
      '<custom-element data-kind="raw">',
    )
    const historicalCatalog = normalizeHistoricalBaseline(catalog)
    expect(historicalCatalog.templates.entries.flatMap((entry) => entry.groups.flatMap((group) => group.items))).toHaveLength(36)
    expect(historicalCatalog.cli.entries.flatMap((entry) => entry.groups.flatMap((group) => group.items))).toHaveLength(76)
  })

  it('allows valid future JSON files and a newer latest without changing the historical baseline', () => {
    const currentCatalog = loadVersionCatalog(VERSIONS_DIR)
    const futureVersion = '999.0.0'
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-changelog-migration-'))
    fs.cpSync(VERSIONS_DIR, tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, 'cli', `${futureVersion}.json`), JSON.stringify({
      versions: [futureVersion],
      releasedAt: { from: '2099-01-01T09:00:00+08:00' },
      title: '后续 CLI 版本',
      archived: false,
      groups: [],
    }))
    fs.writeFileSync(path.join(tmpDir, 'templates', `${futureVersion}.json`), JSON.stringify({
      versions: [futureVersion],
      releasedAt: { from: '2099-01-01T09:00:00+08:00' },
      title: '后续 Templates 版本',
      archived: false,
      groups: [],
    }))

    const catalog = assertHistoricalBaseline(tmpDir)

    expect(catalog.cli.latest).toBe(futureVersion)
    expect(catalog.cli.entries).toHaveLength(currentCatalog.cli.entries.length + 1)
    expect(catalog.templates.latest).toBe(futureVersion)
    expect(catalog.templates.entries).toHaveLength(currentCatalog.templates.entries.length + 1)
  })

  it('detects missing files, duplicate versions and historical content mutations', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-changelog-migration-'))
    fs.cpSync(VERSIONS_DIR, tmpDir, { recursive: true })

    fs.rmSync(path.join(tmpDir, 'templates', '1.0.0.json'))
    expect(() => assertHistoricalBaseline(tmpDir!)).toThrowError(/templates historical migration files are missing/)

    fs.copyFileSync(
      path.join(VERSIONS_DIR, 'templates', '1.0.0.json'),
      path.join(tmpDir, 'templates', '1.0.0.json'),
    )
    fs.copyFileSync(path.join(tmpDir, 'cli', '0.8.10.json'), path.join(tmpDir, 'cli', 'duplicate.json'))
    expect(() => loadVersionCatalog(tmpDir!)).toThrowError(/duplicate version 0\.8\.10/)
    fs.rmSync(path.join(tmpDir, 'cli', 'duplicate.json'))

    const approvedHistoricalBaseline = normalizeHistoricalBaseline(loadVersionCatalog(tmpDir))
    const mutatedEntry = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'cli', '0.4.3.json'), 'utf8'),
    ) as VersionEntry
    mutatedEntry.groups[1]!.items[1]!.description += '（非预期修改）'
    fs.writeFileSync(path.join(tmpDir, 'cli', '0.4.3.json'), `${JSON.stringify(mutatedEntry, null, 2)}\n`)
    expect(normalizeHistoricalBaseline(loadVersionCatalog(tmpDir))).not.toEqual(approvedHistoricalBaseline)
  })
})
