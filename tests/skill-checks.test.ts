import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkSkillLinks, checkSkillPackages } from '../src/lib/skill-checks.js'
import { syncSkillLinks } from '../src/lib/skill-distribution.js'
import { buildDefaultConfig, writeConfig } from '../src/lib/config.js'
import { runDoctor } from '../src/commands/doctor.js'

vi.mock('../src/lib/update-notifier.js', () => ({ checkAndNotify: vi.fn() }))
vi.mock('../src/lib/log.js', () => ({ createLog: () => ({
  intro: vi.fn(), outro: vi.fn(), success: vi.fn(), info: vi.fn(),
  warning: vi.fn(), error: vi.fn(), warn: vi.fn(),
}) }))

describe.sequential('native skill diagnostics', () => {
  const cwd = process.cwd()
  let root: string
  function write(relative: string, content: string): void {
    const file = path.join(root, relative)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  const valid = '---\nname: example\ndescription: Diagnose a sample.\nuser-invocable: true\nallowed-tools: [Read, Grep]\n---\nShared instructions.\n'

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-skill-checks-'))
    write('.harness/skills/example/SKILL.md', valid)
  })
  afterEach(() => {
    process.chdir(cwd)
    vi.restoreAllMocks()
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('accepts shared frontmatter with Claude fields and optional Codex metadata', () => {
    expect(checkSkillPackages(root).every(check => check.status === 'pass')).toBe(true)
    write('.harness/skills/example/agents/openai.yaml', 'interface:\n  display_name: Example\npolicy:\n  allow_implicit_invocation: false\ndependencies:\n  tools:\n    - type: mcp\n      value: example\n')
    const checks = checkSkillPackages(root)
    expect(checks).toHaveLength(2)
    expect(checks.every(check => check.status === 'pass')).toBe(true)
  })

  it.each([
    ['no frontmatter', 'name: example'],
    ['malformed YAML', '---\nname: [broken\n---\n'],
    ['missing description', '---\nname: example\n---\n'],
    ['wrong native types', '---\nname: example\ndescription: valid\nuser-invocable: "true"\nallowed-tools: 42\n---\n'],
  ])('locates invalid entry: %s', (_name, content) => {
    write('.harness/skills/example/SKILL.md', content)
    expect(checkSkillPackages(root)).toContainEqual(expect.objectContaining({
      name: '.harness/skills/example/SKILL.md', status: 'fail',
    }))
  })

  it.each(['interface: [invalid]', 'policy:\n  allow_implicit_invocation: "false"', 'dependencies:\n  tools: [invalid]', 'interface: ['])('locates invalid Codex metadata: %s', content => {
    write('.harness/skills/example/agents/openai.yaml', content)
    expect(checkSkillPackages(root)).toContainEqual(expect.objectContaining({
      name: '.harness/skills/example/agents/openai.yaml', status: 'fail',
    }))
  })

  it('reports missing and unreadable entries, including dangling per-skill links', () => {
    fs.unlinkSync(path.join(root, '.harness/skills/example/SKILL.md'))
    fs.symlinkSync('missing-target', path.join(root, '.harness/skills/broken'))
    expect(checkSkillPackages(root).filter(check => check.status === 'fail')).toHaveLength(2)
    write('.harness/skills/example/SKILL.md', valid)
    const read = fs.readFileSync
    vi.spyOn(fs, 'readFileSync').mockImplementation((...args) => {
      if (String(args[0]).endsWith('example/SKILL.md')) throw new Error('EACCES')
      return read(...args)
    })
    expect(checkSkillPackages(root)).toContainEqual(expect.objectContaining({ name: '.harness/skills/example/SKILL.md', status: 'fail' }))
  })

  it('warns about non-native triggers and disabled manual invocation', () => {
    write('.harness/skills/example/SKILL.md', valid.replace('user-invocable: true', 'user-invocable: false\ntriggers: [example]'))
    expect(checkSkillPackages(root).filter(check => check.status === 'warn')).toHaveLength(2)
  })

  it('distinguishes correct links, missing sources, foreign targets and real directories', () => {
    expect(checkSkillLinks(root, ['claude-code', 'codex']).every(check => check.status === 'fail')).toBe(true)
    syncSkillLinks(root, ['claude-code', 'codex'])
    expect(checkSkillLinks(root, ['claude-code', 'codex']).every(check => check.status === 'pass')).toBe(true)
    fs.renameSync(path.join(root, '.harness/skills'), path.join(root, '.harness/saved'))
    expect(checkSkillLinks(root, ['claude-code', 'codex']).every(check => check.status === 'fail')).toBe(true)
    fs.unlinkSync(path.join(root, '.claude/skills'))
    fs.symlinkSync('../.harness/saved', path.join(root, '.claude/skills'))
    fs.unlinkSync(path.join(root, '.agents/skills'))
    fs.mkdirSync(path.join(root, '.agents/skills'))
    const checks = checkSkillLinks(root, ['claude-code', 'codex'])
    expect(checks.every(check => check.status === 'fail')).toBe(true)
    expect(checks.map(check => check.name)).toEqual(['.claude/skills', '.agents/skills'])
  })

  it('doctor --fix preserves a conflicting batch and exits unsuccessfully', async () => {
    process.chdir(root)
    writeConfig(root, buildDefaultConfig({ name: 'fixture', types: [], targets: ['claude-code', 'codex'], repoType: 'domain' }))
    write('.claude/skills/personal/SKILL.md', 'personal content')
    write('.claude/settings.json', 'personal settings')
    const config = fs.readFileSync(path.join(root, '.harness/config.yml'), 'utf8')
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('doctor exited') })
    await expect(runDoctor({ fix: true })).rejects.toThrow('doctor exited')
    expect(exit).toHaveBeenCalledWith(1)
    expect(fs.readFileSync(path.join(root, '.claude/skills/personal/SKILL.md'), 'utf8')).toBe('personal content')
    expect(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8')).toBe('personal settings')
    expect(fs.readFileSync(path.join(root, '.harness/config.yml'), 'utf8')).toBe(config)
    expect(fs.existsSync(path.join(root, '.agents'))).toBe(false)
    expect(fs.existsSync(path.join(root, '.harness/skills-state.json'))).toBe(false)
  })

  it.each(['codex', '42'])('doctor reports invalid targets %s instead of throwing a TypeError', async targets => {
    process.chdir(root)
    writeConfig(root, buildDefaultConfig({ name: 'fixture', types: [], targets: [] }))
    const file = path.join(root, '.harness/config.yml')
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('targets: []', `targets: ${targets}`))
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('doctor exited') })
    await expect(runDoctor()).rejects.toThrow('doctor exited')
    expect(exit).toHaveBeenCalledWith(1)
  })
})
