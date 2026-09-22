import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { migrateKnowledgeAssets } from '../src/lib/migrate.js'

describe('migrateKnowledgeAssets', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-migrate-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should migrate files from a directory', () => {
    const docsDir = path.join(tmpDir, 'docs')
    fs.mkdirSync(docsDir)
    fs.writeFileSync(path.join(docsDir, 'prd.md'), '# PRD', 'utf-8')
    fs.writeFileSync(path.join(docsDir, 'design.md'), '# Design', 'utf-8')

    const result = migrateKnowledgeAssets([docsDir], tmpDir)

    expect(result.count).toBe(2)
    expect(fs.existsSync(path.join(tmpDir, 'openspec', 'archive', 'migrated', 'prd.md'))).toBe(true)
    expect(fs.existsSync(path.join(tmpDir, 'openspec', 'archive', 'migrated', 'design.md'))).toBe(true)
  })

  it('should handle multiple source directories', () => {
    const docs = path.join(tmpDir, 'docs')
    const wiki = path.join(tmpDir, 'wiki')
    fs.mkdirSync(docs)
    fs.mkdirSync(wiki)
    fs.writeFileSync(path.join(docs, 'a.md'), 'a', 'utf-8')
    fs.writeFileSync(path.join(wiki, 'b.md'), 'b', 'utf-8')

    const result = migrateKnowledgeAssets([docs, wiki], tmpDir)
    expect(result.count).toBe(2)
  })

  it('should skip non-existent sources', () => {
    const result = migrateKnowledgeAssets([path.join(tmpDir, 'nope')], tmpDir)
    expect(result.count).toBe(0)
  })

  it('should handle nested directories', () => {
    const docs = path.join(tmpDir, 'docs')
    fs.mkdirSync(path.join(docs, 'sub'), { recursive: true })
    fs.writeFileSync(path.join(docs, 'sub', 'nested.md'), 'nested', 'utf-8')

    const result = migrateKnowledgeAssets([docs], tmpDir)
    expect(result.count).toBe(1)
    expect(fs.existsSync(path.join(tmpDir, 'openspec', 'archive', 'migrated', 'sub', 'nested.md'))).toBe(true)
  })
})
