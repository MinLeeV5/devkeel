import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  formatReleaseDateLabel,
  formatVersionLabel,
  getVersionSectionId,
  validateVersionEntry,
  type VersionEntry,
} from '../src/lib/version-catalog'
import { loadVersionCatalog } from '../version-catalog'

const VALID_ENTRY: VersionEntry = {
  versions: ['1.0.0'],
  releasedAt: { from: '2026-07-01T09:00:00+08:00' },
  title: 'First release',
  archived: false,
  groups: [
    {
      type: 'feat',
      label: 'Features',
      items: [{ name: 'Catalog', description: 'Read `JSON` files.' }],
    },
  ],
}

function writeEntry(root: string, stream: 'cli' | 'templates', fileName: string, entry: unknown): void {
  const streamDir = path.join(root, stream)
  fs.mkdirSync(streamDir, { recursive: true })
  fs.writeFileSync(path.join(streamDir, fileName), JSON.stringify(entry))
}

function seedBothStreams(root: string): void {
  writeEntry(root, 'cli', '1.0.0.json', VALID_ENTRY)
  writeEntry(root, 'templates', '1.0.0.json', VALID_ENTRY)
}

describe('version catalog', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-version-catalog-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('validateVersionEntry', () => {
    it('should accept single and merged version entries', () => {
      const merged = {
        ...VALID_ENTRY,
        versions: ['0.8.5', '0.8.6'],
        releasedAt: {
          from: '2026-06-01T09:00:00+08:00',
          to: '2026-06-02T09:00:00+08:00',
        },
        groups: [],
      }

      expect(validateVersionEntry(VALID_ENTRY, '/versions/1.0.0.json')).toEqual({
        entry: VALID_ENTRY,
        errors: [],
      })
      expect(validateVersionEntry(merged, '/versions/0.8.6.json')).toEqual({
        entry: merged,
        errors: [],
      })
    })

    it.each([
      [{ ...VALID_ENTRY, versions: [] }, 'versions'],
      [{ ...VALID_ENTRY, title: '' }, 'title'],
      [{ ...VALID_ENTRY, releasedAt: { from: '2026-07-01' } }, 'releasedAt.from'],
      [
        { ...VALID_ENTRY, groups: [{ ...VALID_ENTRY.groups[0], type: 'other' }] },
        'groups[0].type',
      ],
    ])('should report the source path and invalid field for %#', (value, field) => {
      const result = validateVersionEntry(value, '/versions/broken.json')

      expect(result.entry).toBeUndefined()
      expect(result.errors.join('\n')).toContain('/versions/broken.json')
      expect(result.errors.join('\n')).toContain(field)
    })

    it('should reject reversed release ranges and duplicate versions', () => {
      const result = validateVersionEntry(
        {
          ...VALID_ENTRY,
          versions: ['1.0.0', '1.0.0'],
          releasedAt: {
            from: '2026-07-02T09:00:00+08:00',
            to: '2026-07-01T09:00:00+08:00',
          },
        },
        '/versions/range.json',
      )

      expect(result.errors.join('\n')).toContain('versions[1]')
      expect(result.errors.join('\n')).toContain('releasedAt.to')
    })

    it.each([
      '2026-02-30T09:00:00+08:00',
      '2025-02-29T09:00:00+08:00',
      '2026-04-31T09:00:00Z',
    ])('should reject impossible calendar timestamp %s', (from) => {
      const result = validateVersionEntry(
        { ...VALID_ENTRY, releasedAt: { from } },
        '/versions/impossible-date.json',
      )

      expect(result.entry).toBeUndefined()
      expect(result.errors.join('\n')).toContain('releasedAt.from')
      expect(result.errors.join('\n')).toContain('valid ISO timestamp with timezone')
    })

    it('should accept a valid leap-day timestamp with timezone', () => {
      const entry: VersionEntry = {
        ...VALID_ENTRY,
        releasedAt: { from: '2024-02-29T23:59:59.123+08:00' },
      }

      expect(validateVersionEntry(entry, '/versions/leap-day.json')).toEqual({
        entry,
        errors: [],
      })
    })

    it('should accept the maximum ISO 8601 timezone offset', () => {
      const entry: VersionEntry = {
        ...VALID_ENTRY,
        releasedAt: { from: '2026-01-01T09:00:00+14:00' },
      }

      expect(validateVersionEntry(entry, '/versions/max-offset.json')).toEqual({
        entry,
        errors: [],
      })
    })

    it.each([
      '2026-01-01T24:00:00+08:00',
      '2026-01-01T09:60:00+08:00',
      '2026-01-01T09:00:60+08:00',
      '2026-01-01T09:00:00+24:00',
      '2026-01-01T09:00:00+08:60',
      '2026-01-01T09:00:00+14:01',
      '2026-01-01T09:00:00-14:01',
      '2026-01-01T09:00:00+23:59',
    ])('should reject out-of-range timestamp component %s', (from) => {
      const result = validateVersionEntry(
        { ...VALID_ENTRY, releasedAt: { from } },
        '/versions/out-of-range-timestamp.json',
      )

      expect(result.entry).toBeUndefined()
      expect(result.errors.join('\n')).toContain('releasedAt.from')
    })

    it.each([
      [['0.2', '0.1'], 'two-segment'],
      [['0.8.6', '0.8.5'], 'three-segment'],
      [['0.1', '0.1.0'], 'equivalent'],
    ])('should reject %s versions that are not strictly old to new (%s)', (versions) => {
      const result = validateVersionEntry(
        { ...VALID_ENTRY, versions },
        '/versions/reversed.json',
      )

      expect(result.errors.join('\n')).toContain('versions[1]')
      expect(result.errors.join('\n')).toContain('strictly old to new')
    })

    it('should reject non-numeric dotted versions', () => {
      const result = validateVersionEntry(
        { ...VALID_ENTRY, versions: ['v1.0.0'] },
        '/versions/non-numeric.json',
      )

      expect(result.errors.join('\n')).toContain('versions[0]')
      expect(result.errors.join('\n')).toContain('numeric dotted version')
    })
  })

  describe('loadVersionCatalog', () => {
    it('should sort streams independently by release end and calculate latest', () => {
      writeEntry(tmpDir, 'cli', '0.1.json', {
        ...VALID_ENTRY,
        versions: ['0.1'],
        releasedAt: { from: '2026-01-01T09:00:00+08:00' },
      })
      writeEntry(tmpDir, 'cli', '0.2.0.json', {
        ...VALID_ENTRY,
        versions: ['0.2.0'],
        releasedAt: {
          from: '2026-01-02T09:00:00+08:00',
          to: '2026-01-04T09:00:00+08:00',
        },
      })
      writeEntry(tmpDir, 'templates', '2.0.0.json', {
        ...VALID_ENTRY,
        versions: ['2.0.0'],
        releasedAt: { from: '2026-01-03T09:00:00+08:00' },
      })

      const catalog = loadVersionCatalog(tmpDir)

      expect(catalog.cli.latest).toBe('0.2.0')
      expect(catalog.cli.entries.map((entry) => entry.versions.at(-1))).toEqual(['0.2.0', '0.1'])
      expect(catalog.templates.latest).toBe('2.0.0')
      expect(Object.isFrozen(catalog)).toBe(true)
      expect(Object.isFrozen(catalog.cli.entries)).toBe(true)
    })

    it('should aggregate streams whose latest entry is archived', () => {
      writeEntry(tmpDir, 'cli', '1.0.0.json', { ...VALID_ENTRY, archived: true })
      writeEntry(tmpDir, 'templates', '1.0.0.json', { ...VALID_ENTRY, archived: true })

      expect(() => loadVersionCatalog(tmpDir)).toThrowError(
        /cli.*latest entry 1\.0\.0.*archived.*false[\s\S]*templates.*latest entry 1\.0\.0.*archived.*false/,
      )
    })

    it('should aggregate parse, filename, duplicate and empty stream errors', () => {
      writeEntry(tmpDir, 'cli', 'wrong.json', VALID_ENTRY)
      writeEntry(tmpDir, 'cli', 'duplicate.json', VALID_ENTRY)
      fs.writeFileSync(path.join(tmpDir, 'cli', 'invalid.json'), '{')
      fs.mkdirSync(path.join(tmpDir, 'templates'), { recursive: true })

      expect(() => loadVersionCatalog(tmpDir)).toThrowError(/wrong\.json[\s\S]*duplicate\.json[\s\S]*invalid\.json|invalid\.json[\s\S]*wrong\.json/)

      try {
        loadVersionCatalog(tmpDir)
      } catch (error) {
        const message = String(error)
        expect(message).toContain('expected 1.0.0.json')
        expect(message).toContain('duplicate version 1.0.0')
        expect(message).toContain('templates')
        expect(message).toContain('no JSON entries')
      }
    })

    it('should ignore non-json files and reject a missing stream directory', () => {
      seedBothStreams(tmpDir)
      fs.writeFileSync(path.join(tmpDir, 'cli', 'notes.md'), 'ignored')

      expect(loadVersionCatalog(tmpDir).cli.entries).toHaveLength(1)

      fs.rmSync(path.join(tmpDir, 'templates'), { recursive: true })
      expect(() => loadVersionCatalog(tmpDir)).toThrowError(/templates.*directory cannot be inspected/)
    })

    it('should aggregate a non-directory stream error with errors from the other stream', () => {
      fs.writeFileSync(path.join(tmpDir, 'cli'), 'not a directory')
      writeEntry(tmpDir, 'templates', 'broken.json', { ...VALID_ENTRY, title: '' })

      expect(() => loadVersionCatalog(tmpDir)).toThrowError(/cli.*not a directory[\s\S]*templates.*broken\.json.*title/)
    })

    it('should aggregate stat errors for both streams when the catalog root is a file', () => {
      const versionsFile = path.join(tmpDir, 'versions-file')
      fs.writeFileSync(versionsFile, 'not a catalog root')

      expect(() => loadVersionCatalog(versionsFile)).toThrowError(
        /cli.*directory cannot be inspected[\s\S]*templates.*directory cannot be inspected/,
      )
    })

    it('should aggregate a real unreadable-directory error when the platform enforces permissions', () => {
      const cliDir = path.join(tmpDir, 'cli')
      fs.mkdirSync(cliDir)
      writeEntry(tmpDir, 'templates', 'broken.json', { ...VALID_ENTRY, title: '' })
      fs.chmodSync(cliDir, 0o000)

      let permissionDenied = false
      try {
        fs.readdirSync(cliDir)
      } catch {
        permissionDenied = true
      }

      try {
        if (!permissionDenied) return
        expect(() => loadVersionCatalog(tmpDir)).toThrowError(
          /cli.*directory cannot be read[\s\S]*templates.*broken\.json.*title/,
        )
      } finally {
        fs.chmodSync(cliDir, 0o700)
      }
    })
  })

  describe('formatters', () => {
    it('should format version labels, section ids and release ranges', () => {
      expect(formatVersionLabel(['0.8.5', '0.8.6'])).toBe('v0.8.5 ~ v0.8.6')
      expect(getVersionSectionId('cli', ['0.8.5', '0.8.6'])).toBe('v0.8.6')
      expect(getVersionSectionId('templates', ['1.2.2', '1.2.3'])).toBe('tpl-v1.2.3')
      expect(
        formatReleaseDateLabel({
          from: '2026-07-01T09:30:00+08:00',
          to: '2026-07-02T10:45:00+08:00',
        }),
      ).toBe('2026-07-01 09:30 ~ 2026-07-02 10:45')
    })
  })
})
