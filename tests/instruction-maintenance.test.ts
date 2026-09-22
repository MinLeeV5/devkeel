import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SKILL_DIR = path.resolve('.harness/skills/instruction-maintenance')
const AUDIT_SCRIPT = path.join(SKILL_DIR, 'scripts/audit-instruction-diff.mjs')

describe('instruction maintenance skill', () => {
  it('stays project-local', () => {
    expect(fs.existsSync(path.join(SKILL_DIR, 'SKILL.md'))).toBe(true)
    expect(fs.existsSync(path.resolve('templates/skills/instruction-maintenance'))).toBe(false)
  })

  it('includes every instruction file under an explicit schema path', () => {
    const output = execFileSync(process.execPath, [
      AUDIT_SCRIPT,
      '--base',
      'HEAD',
      '--path',
      'templates/openspec/schemas',
    ], { encoding: 'utf8' })

    expect(output).toContain('templates/openspec/schemas/full/templates/spec.md')
    expect(output).toContain('templates/openspec/schemas/lite/templates/tasks.md')
    expect(output).toContain('Mirror mismatches:\n- none')
  })
})
