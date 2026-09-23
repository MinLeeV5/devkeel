import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { runSync } from '../src/commands/sync.js'
import { buildDefaultConfig, writeConfig } from '../src/lib/config.js'
import { planSkillLinks, syncSkillLinks } from '../src/lib/skill-distribution.js'

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(), outro: vi.fn(), cancel: vi.fn(),
  log: { info: vi.fn(), success: vi.fn(), warn: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

describe.sequential('skills distribution', () => {
  const cwd = process.cwd()
  const originalExitCode = process.exitCode
  let root: string

  function write(relative: string, content: string): void {
    const file = path.join(root, relative)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-skills-'))
    process.chdir(root)
    for (const dir of ['skills', 'rules', 'agents']) {
      fs.mkdirSync(path.join(root, '.harness', dir), { recursive: true })
    }
    writeConfig(root, buildDefaultConfig({ name: 'skills-fixture', types: [], targets: [] }))
  })

  afterEach(() => {
    process.chdir(cwd)
    vi.restoreAllMocks()
    process.exitCode = originalExitCode
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('makes additions and edits visible through both native paths without another sync', async () => {
    await runSync({ targets: 'claude-code,codex' })
    expect(fs.readFileSync(path.join(root, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n')
    write('.harness/skills/example/SKILL.md', 'first version')
    for (const platform of ['.claude', '.agents']) {
      expect(fs.lstatSync(path.join(root, platform, 'skills')).isSymbolicLink()).toBe(true)
      expect(fs.readFileSync(path.join(root, platform, 'skills/example/SKILL.md'), 'utf8')).toBe('first version')
    }
    write('.harness/skills/example/SKILL.md', 'edited version')
    for (const platform of ['.claude', '.agents']) {
      expect(fs.readFileSync(path.join(root, platform, 'skills/example/SKILL.md'), 'utf8')).toBe('edited version')
    }
    await runSync({ targets: 'claude-code,codex' })
    expect(fs.readFileSync(path.join(root, '.harness/skills/example/SKILL.md'), 'utf8')).toBe('edited version')
  })

  it('preserves platform settings, agents and unrelated files during repeated sync', async () => {
    const files = {
      '.claude/settings.json': '{"custom":true}',
      '.claude/agents/personal.md': 'personal agent',
      '.claude/rules/personal.md': 'personal rule',
      '.agents/notes.txt': 'personal note',
      '.codex/agents/personal.toml': 'name = "personal"',
    }
    for (const [file, content] of Object.entries(files)) write(file, content)
    await runSync({ targets: 'claude-code,codex' })
    await runSync({ targets: 'claude-code,codex' })
    for (const [file, content] of Object.entries(files)) {
      expect(fs.readFileSync(path.join(root, file), 'utf8')).toBe(content)
    }
  })

  it('preflights the full batch before changing configuration or either platform', async () => {
    write('.agents/skills/personal/SKILL.md', 'personal skill')
    const config = fs.readFileSync(path.join(root, '.harness/config.yml'), 'utf8')
    await runSync({ targets: 'claude-code,codex' })
    expect(process.exitCode).toBe(1)
    expect(fs.readFileSync(path.join(root, '.harness/config.yml'), 'utf8')).toBe(config)
    expect(fs.existsSync(path.join(root, '.claude'))).toBe(false)
    expect(fs.existsSync(path.join(root, '.harness/skills-state.json'))).toBe(false)
    expect(fs.readFileSync(path.join(root, '.agents/skills/personal/SKILL.md'), 'utf8')).toBe('personal skill')
  })

  it('preserves non-skill files and dangling links even when force is selected', async () => {
    for (const platform of ['.claude', '.agents']) {
      write(`${platform}/rules`, 'personal rules file')
      fs.symlinkSync('missing-personal-agents', path.join(root, platform, 'agents'))
    }
    await runSync({ targets: 'claude-code,codex', force: true })
    for (const platform of ['.claude', '.agents']) {
      expect(fs.readFileSync(path.join(root, platform, 'rules'), 'utf8')).toBe('personal rules file')
      expect(fs.readlinkSync(path.join(root, platform, 'agents'))).toBe('missing-personal-agents')
    }
  })

  it('adopts known legacy links and records their targets without changing source content', () => {
    fs.mkdirSync(path.join(root, '.claude'))
    fs.symlinkSync('../.harness/skills', path.join(root, '.claude/skills'))
    write('.harness/skills/personal/SKILL.md', 'authored source')
    expect(syncSkillLinks(root, ['claude-code']).ok).toBe(true)
    const state = JSON.parse(fs.readFileSync(path.join(root, '.harness/skills-state.json'), 'utf8'))
    expect(state.links['.claude/skills']).toBe('../.harness/skills')
    expect(syncSkillLinks(root, ['claude-code']).changed).toBe(false)
    write('.harness/skills/personal/SKILL.md', 'edited authored source')
    expect(syncSkillLinks(root, ['claude-code']).ok).toBe(true)
  })

  it('detects manually retargeted and broken links while preserving both the link and its target', () => {
    syncSkillLinks(root, ['claude-code'])
    fs.unlinkSync(path.join(root, '.claude/skills'))
    fs.symlinkSync('../personal-skills', path.join(root, '.claude/skills'))
    expect(planSkillLinks(root, ['claude-code']).links[0]?.status).toBe('conflict')
    expect(syncSkillLinks(root, ['claude-code', 'codex']).ok).toBe(false)
    expect(fs.readlinkSync(path.join(root, '.claude/skills'))).toBe('../personal-skills')
    expect(fs.existsSync(path.join(root, '.agents'))).toBe(false)
  })

  it('rejects unsafe platform parents and malformed ownership state without mutations', () => {
    const outside = path.join(root, 'outside')
    fs.mkdirSync(outside)
    fs.symlinkSync(outside, path.join(root, '.claude'))
    expect(syncSkillLinks(root, ['claude-code']).ok).toBe(false)
    expect(fs.readdirSync(outside)).toEqual([])
    fs.unlinkSync(path.join(root, '.claude'))
    write('.harness/skills-state.json', '{"version":1,"links":{"../outside":"target"}}')
    expect(syncSkillLinks(root, ['claude-code']).ok).toBe(false)
    expect(fs.existsSync(path.join(root, '.claude'))).toBe(false)
  })

  it('rolls back newly created links if persisting ownership fails', () => {
    const rename = vi.spyOn(fs, 'renameSync').mockImplementation(() => { throw new Error('disk full') })
    const result = syncSkillLinks(root, ['claude-code', 'codex'])
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('disk full')
    expect(fs.lstatSync(path.join(root, '.claude/skills'), { throwIfNoEntry: false })).toBeUndefined()
    expect(fs.lstatSync(path.join(root, '.agents/skills'), { throwIfNoEntry: false })).toBeUndefined()
    expect(fs.existsSync(path.join(root, '.harness/skills-state.json'))).toBe(false)
    rename.mockRestore()
  })

  it('backs up real directories and symlinks before force replacing only the skill entries', () => {
    write('.claude/skills/personal/SKILL.md', 'personal content')
    write('.claude/settings.json', 'settings')
    write('personal-skills/keep.txt', 'external target')
    fs.mkdirSync(path.join(root, '.agents'))
    fs.symlinkSync('../personal-skills', path.join(root, '.agents/skills'))
    const result = syncSkillLinks(root, ['claude-code', 'codex'], { force: true })
    expect(result.ok).toBe(true)
    expect(result.backupPath).toBeTruthy()
    expect(fs.readFileSync(path.join(result.backupPath!, '.claude/skills/personal/SKILL.md'), 'utf8')).toBe('personal content')
    expect(fs.readlinkSync(path.join(result.backupPath!, '.agents/skills'))).toBe('../personal-skills')
    expect(fs.readFileSync(path.join(root, 'personal-skills/keep.txt'), 'utf8')).toBe('external target')
    expect(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8')).toBe('settings')
    expect(planSkillLinks(root, ['claude-code', 'codex']).links.every(link => link.status === 'linked')).toBe(true)
  })

  it('exposes force through sync and retains an exact backup of a conflicting file', async () => {
    write('.claude/skills', 'original file')
    await runSync({ targets: 'claude-code', force: true })
    expect(fs.lstatSync(path.join(root, '.claude/skills')).isSymbolicLink()).toBe(true)
    const backups = fs.readdirSync(path.join(root, '.harness/skills-backups'))
    expect(backups).toHaveLength(1)
    expect(fs.readFileSync(path.join(root, '.harness/skills-backups', backups[0]!, '.claude/skills'), 'utf8')).toBe('original file')
  })

  it('does not replace any target or configuration if a later backup fails', async () => {
    write('.claude/skills', 'first original')
    write('.agents/skills', 'second original')
    const config = fs.readFileSync(path.join(root, '.harness/config.yml'), 'utf8')
    const copy = fs.cpSync
    let calls = 0
    vi.spyOn(fs, 'cpSync').mockImplementation((...args) => {
      calls++
      if (calls === 2) throw new Error('backup disk full')
      copy(...args)
    })
    await runSync({ targets: 'claude-code,codex', force: true })
    expect(process.exitCode).toBe(1)
    expect(fs.readFileSync(path.join(root, '.claude/skills'), 'utf8')).toBe('first original')
    expect(fs.readFileSync(path.join(root, '.agents/skills'), 'utf8')).toBe('second original')
    expect(fs.readFileSync(path.join(root, '.harness/config.yml'), 'utf8')).toBe(config)
    expect(fs.existsSync(path.join(root, '.harness/skills-state.json'))).toBe(false)
  })

  it('restores conflicting content when creating the replacement link fails', () => {
    write('.claude/skills/original.txt', 'restore me')
    vi.spyOn(fs, 'symlinkSync').mockImplementation(() => { throw new Error('link denied') })
    const result = syncSkillLinks(root, ['claude-code'], { force: true })
    expect(result.ok).toBe(false)
    expect(result.errors.join('\n')).toContain('link denied')
    expect(fs.readFileSync(path.join(root, '.claude/skills/original.txt'), 'utf8')).toBe('restore me')
    expect(fs.readFileSync(path.join(result.backupPath!, '.claude/skills/original.txt'), 'utf8')).toBe('restore me')
  })

  it('never treats force as permission to replace an unsafe parent or write backups through a symlink', () => {
    write('.claude/skills', 'original')
    fs.mkdirSync(path.join(root, 'outside'))
    fs.symlinkSync('../outside', path.join(root, '.harness/skills-backups'))
    expect(syncSkillLinks(root, ['claude-code'], { force: true }).ok).toBe(false)
    expect(fs.readdirSync(path.join(root, 'outside'))).toEqual([])
    expect(fs.readFileSync(path.join(root, '.claude/skills'), 'utf8')).toBe('original')
  })

  it('reports partial deletion with an intact backup and a precise recovery path', () => {
    write('.claude/skills/first.txt', 'first')
    write('.claude/skills/second.txt', 'second')
    const remove = fs.rmSync
    vi.spyOn(fs, 'rmSync').mockImplementation((...args) => {
      if (String(args[0]) === path.join(root, '.claude/skills')) {
        fs.unlinkSync(path.join(root, '.claude/skills/first.txt'))
        throw new Error('EACCES')
      }
      remove(...args)
    })
    const result = syncSkillLinks(root, ['claude-code', 'codex'], { force: true })
    expect(result.ok).toBe(false)
    expect(result.changed).toBe(true)
    expect(result.errors.join('\n')).toContain(path.join(result.backupPath!, '.claude/skills'))
    expect(fs.readFileSync(path.join(result.backupPath!, '.claude/skills/first.txt'), 'utf8')).toBe('first')
    expect(fs.readFileSync(path.join(result.backupPath!, '.claude/skills/second.txt'), 'utf8')).toBe('second')
    expect(fs.existsSync(path.join(root, '.agents'))).toBe(false)
    expect(fs.existsSync(path.join(root, '.harness/skills-state.json'))).toBe(false)
  })
})
