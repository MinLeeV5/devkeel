import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const CLI_ENTRY_PATH = path.resolve('src/index.ts')
const DOC_MAINTENANCE_SKILL_PATH = path.resolve('.harness/skills/doc-maintenance/SKILL.md')

describe('doc maintenance skill', () => {
  it('should run help for every registered CLI command and no removed commands', () => {
    const cliEntry = fs.readFileSync(CLI_ENTRY_PATH, 'utf-8')
    const skill = fs.readFileSync(DOC_MAINTENANCE_SKILL_PATH, 'utf-8')
    const registeredCommands = [...cliEntry.matchAll(/\.command\('([^'\s<]+)/g)]
      .map((match) => match[1]!)
      .sort()
    const helpCommands = [...skill.matchAll(/node bin\/devkeel\.js ([a-z][\w-]*) --help/g)]
      .map((match) => match[1]!)
      .sort()

    expect(helpCommands).toEqual(registeredCommands)
  })
})
