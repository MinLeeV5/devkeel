import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_EXTENSION_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['"](\.{1,2}\/[^'"]+\.[cm]?[jt]sx?)['"]/g

describe('web import specifiers', () => {
  it('should omit extensions from local TypeScript module specifiers', () => {
    const violations = findSourceExtensionSpecifiers(WEB_ROOT)

    expect(violations).toEqual([])
  })
})

function findSourceExtensionSpecifiers(dir: string): string[] {
  const violations: string[] = []

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue

    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      violations.push(...findSourceExtensionSpecifiers(entryPath))
      continue
    }
    if (!/\.tsx?$/.test(entry.name)) continue

    const source = fs.readFileSync(entryPath, 'utf-8')
    for (const match of source.matchAll(SOURCE_EXTENSION_SPECIFIER)) {
      violations.push(`${path.relative(WEB_ROOT, entryPath)}: ${match[1]}`)
    }
  }

  return violations
}
